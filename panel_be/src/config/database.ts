import { Sequelize } from 'sequelize';

// Create Sequelize instance
const sequelize = new Sequelize(
  process.env.DB_NAME || 'panel_sam',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    }
  }
);

export const connectDB = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL connected successfully');
    
    // Sync database (create tables if they don't exist)
    // In production, you should use migrations instead of sync
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('📊 Database synchronized');
    }
    
  } catch (error) {
    console.error('❌ Failed to connect to MySQL:', error);
    process.exit(1);
  }
};

export default sequelize; 