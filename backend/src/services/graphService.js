const { getSession } = require('../config/neo4j');
const logger = require('../config/logger');

/**
 * Service to handle Neo4j Graph operations for Niti Setu.
 */
class GraphService {
  /**
   * Create or update a Scheme node and link it to its Category.
   */
  async ensureSchemeNode(schemeData) {
    const session = getSession();
    try {
      const cypher = `
        MERGE (s:Scheme {name: $name})
        SET s.description = $description,
            s.id = $id
        WITH s
        MATCH (c:Category {id: $categoryId})
        MERGE (s)-[:BELONGS_TO]->(c)
        RETURN s
      `;
      
      const result = await session.run(cypher, {
        name: schemeData.name,
        description: schemeData.description || '',
        id: schemeData.id.toString(),
        categoryId: schemeData.category
      });
      
      return result.records[0]?.get('s').properties;
    } catch (error) {
      logger.error('Neo4j ensureSchemeNode error:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Create a Document node and link it to a Scheme.
   */
  async addDocumentToScheme(schemeName, docMetadata) {
    const session = getSession();
    try {
      const cypher = `
        MATCH (s:Scheme {name: $schemeName})
        MERGE (d:Document {path: $path})
        SET d.type = $type,
            d.state = $state,
            d.language = $language,
            d.uploadedAt = datetime()
        MERGE (d)-[:BELONGS_TO_SCHEME]->(s)
        RETURN d
      `;
      
      const result = await session.run(cypher, {
        schemeName,
        path: docMetadata.path,
        type: docMetadata.type || 'guidelines',
        state: docMetadata.state || 'All',
        language: docMetadata.language || 'en'
      });
      
      return result.records[0]?.get('d').properties;
    } catch (error) {
      logger.error('Neo4j addDocumentToScheme error:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Link Chunks to a Document in Neo4j.
   */
  async linkChunkToDocument(docPath, chunkMetadata) {
    const session = getSession();
    try {
      const cypher = `
        MATCH (d:Document {path: $docPath})
        CREATE (c:Chunk {
          chunkIndex: $chunkIndex,
          page: $page,
          section: $section
        })
        CREATE (c)-[:PART_OF]->(d)
        RETURN c
      `;
      
      await session.run(cypher, {
        docPath,
        chunkIndex: chunkMetadata.chunkIndex,
        page: chunkMetadata.page,
        section: chunkMetadata.section || 'General'
      });
    } catch (error) {
      logger.error('Neo4j linkChunkToDocument error:', error);
    } finally {
      await session.close();
    }
  }

  /**
   * Link multiple Chunks to a Document in Neo4j in a single batch.
   */
  async linkChunksBatch(docPath, chunksMetadata) {
    const session = getSession();
    try {
      const cypher = `
        MATCH (d:Document {path: $docPath})
        UNWIND $chunks as chunk
        CREATE (c:Chunk {
          chunkIndex: chunk.chunkIndex,
          page: chunk.page,
          section: chunk.section || 'General'
        })
        CREATE (c)-[:PART_OF]->(d)
      `;
      
      await session.run(cypher, {
        docPath,
        chunks: chunksMetadata
      });
    } catch (error) {
      logger.error('Neo4j linkChunksBatch error:', error);
    } finally {
      await session.close();
    }
  }
  
  /**
   * Check if a target scheme conflicts with any of the farmer's current schemes.
   * Traverses the EXCLUSIVE_OF relationship in Neo4j.
   */
  async checkConflicts(currentSchemeNames, targetSchemeName) {
    if (!currentSchemeNames || currentSchemeNames.length === 0) return [];
    
    const session = getSession();
    try {
      const cypher = `
        MATCH (target:Scheme {name: $targetSchemeName})
        MATCH (current:Scheme)
        WHERE current.name IN $currentSchemeNames
        MATCH (target)-[r:EXCLUSIVE_OF]-(current)
        RETURN current.name as conflictingScheme, r.reason as reason
      `;
      
      const result = await session.run(cypher, {
        currentSchemeNames,
        targetSchemeName
      });
      
      return result.records.map(record => ({
        scheme: record.get('conflictingScheme'),
        reason: record.get('reason') || 'Mutual exclusion rule applies'
      }));
    } catch (error) {
      logger.error('Neo4j checkConflicts error:', error);
      return [];
    } finally {
      await session.close();
    }
  }

  /**
   * Find related schemes using Graph traversal.
   * Priority: COMPLEMENTS > Same Category > Random
   */
  async getSuggestions(schemeName, limit = 3) {
    const session = getSession();
    try {
      const cypher = `
        MATCH (s:Scheme {name: $schemeName})
        OPTIONAL MATCH (s)-[:COMPLEMENTS]->(comp:Scheme)
        OPTIONAL MATCH (s)-[:BELONGS_TO]->(cat:Category)<-[:BELONGS_TO]-(neighbor:Scheme)
        WHERE neighbor.name <> $schemeName
        
        WITH s, collect(DISTINCT comp) + collect(DISTINCT neighbor) as candidates
        UNWIND candidates as c
        // Global exclusion list
        WHERE NOT (s)-[:EXCLUSIVE_OF]-(c) 
        RETURN DISTINCT c.name as name, c.description as description
        LIMIT $limit
      `;
      
      const result = await session.run(cypher, { schemeName, limit });
      return result.records.map(record => ({
        name: record.get('name'),
        description: record.get('description')
      }));
    } catch (error) {
      logger.error('Neo4j getSuggestions error:', error);
      return [];
    } finally {
      await session.close();
    }
  }

  /**
   * Fetch the entire graph (Categorical taxonomy + Schemes + Documents)
   * Formatted for Cytoscape.js or other visualization tools.
   */
  async getGraphData() {
    const session = getSession();
    try {
      // Fetch Categories, Schemes, and their BELONGS_TO relationship
      // Also fetch Documents and their BELONGS_TO_SCHEME relationship
      const cypher = `
        MATCH (c:Category)
        OPTIONAL MATCH (s:Scheme)-[:BELONGS_TO]->(c)
        OPTIONAL MATCH (d:Document)-[:BELONGS_TO_SCHEME]->(s)
        // Also get cross-scheme relationships if any exist
        OPTIONAL MATCH (s)-[r:COMPLEMENTS|EXCLUSIVE_OF]->(s2:Scheme)
        RETURN c, s, d, r, s2
      `;

      const result = await session.run(cypher);
      const nodes = new Map();
      const edges = [];

      result.records.forEach(record => {
        const cat = record.get('c');
        const scheme = record.get('s');
        const doc = record.get('d');
        const rel = record.get('r');
        const scheme2 = record.get('s2');

        // Add Category Node
        if (cat) {
          nodes.set(`cat_${cat.properties.id}`, {
            id: `cat_${cat.properties.id}`,
            label: cat.properties.name,
            type: 'Category',
            color: '#4f46e5' // Indigo
          });
        }

        // Add Scheme Node & Edge to Category
        if (scheme) {
          const sId = `scheme_${scheme.properties.id}`;
          nodes.set(sId, {
            id: sId,
            label: scheme.properties.name,
            type: 'Scheme',
            color: '#10b981' // Emerald
          });
          
          if (cat) {
            edges.push({
              source: sId,
              target: `cat_${cat.properties.id}`,
              label: 'BELONGS_TO'
            });
          }
        }

        // Add Document Node & Edge to Scheme
        if (doc) {
          const dId = `doc_${doc.properties.path}`;
          nodes.set(dId, {
            id: dId,
            label: doc.properties.path.split('-').pop(), // Simple label
            type: 'Document',
            color: '#f59e0b' // Amber
          });
          
          if (scheme) {
            edges.push({
              source: dId,
              target: `scheme_${scheme.properties.id}`,
              label: 'PART_OF'
            });
          }
        }

        // Add cross-scheme relationships
        if (rel && scheme && scheme2) {
          edges.push({
            source: `scheme_${scheme.properties.id}`,
            target: `scheme_${scheme2.properties.id}`,
            label: rel.type
          });
        }
      });

      return {
        nodes: Array.from(nodes.values()),
        edges: edges
      };
    } catch (error) {
      logger.error('Neo4j getGraphData error:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Determine which categories match a farmer's profile.
   */
  async getRecommendedCategories(profile) {
    const session = getSession();
    try {
      const cypher = `
        MATCH (c:Category)
        RETURN c.id as id, c.name as name
      `;
      
      const result = await session.run(cypher);
      return result.records.map(record => record.get('id'));
    } catch (error) {
      logger.error('Neo4j getRecommendedCategories error:', error);
      return [];
    } finally {
      await session.close();
    }
  }
}

module.exports = new GraphService();
