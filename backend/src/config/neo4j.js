const neo4j = require('neo4j-driver');
const logger = require('./logger');
const config = require('./env');

const uri = config.neo4jUri;
const user = config.neo4jUser;
const password = config.neo4jPassword;

let driver;

try {
  if (uri && user && password) {
    driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
    logger.info('Neo4j Driver initialized');
  } else {
    logger.warn('Neo4j credentials missing in environment variables');
  }
} catch (error) {
  logger.error('Failed to create Neo4j driver:', error);
}

const getSession = (database = config.neo4jDatabase) => {
  if (!driver) {
    throw new Error('Neo4j driver not initialized. Please check your credentials.');
  }
  return driver.session({ database });
};

const closeDriver = async () => {
  if (driver) {
    await driver.close();
    logger.info('Neo4j connection closed');
  }
};

module.exports = {
  driver,
  getSession,
  closeDriver,
};
