import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

// Interface for Question
export interface Question {
  id: string;
  type: 'text' | 'number' | 'email' | 'tel' | 'url' | 'date' | 'time' | 'datetime-local' | 'month' | 'week' | 'select' | 'textarea' | 'radio' | 'checkbox' | 'range' | 'file';
  question: string;
  required: boolean;
  options?: string[];
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  pattern?: string;
  accept?: string;
  multiple?: boolean;
  rows?: number;
  cols?: number;
}

// Interface for Survey attributes
export interface SurveyAttributes {
  id: number;
  title: string;
  description: string;
  questions: Question[];
  createdBy: number;
  status: 'draft' | 'active' | 'paused' | 'completed';
  ageRangeMin?: number;
  ageRangeMax?: number;
  targetGender?: string;
  targetCountries?: string;
  targetLanguages?: string;
  maxParticipants?: number;
  allowAnonymous: boolean;
  requireEmail: boolean;
  showProgressBar: boolean;
  allowBackNavigation: boolean;
  autoSave: boolean;
  timeLimit?: number;
  startDate?: Date;
  endDate?: Date;
  totalResponses: number;
  completedResponses: number;
  inProgressResponses: number;
  tags: string;
  category: string;
  estimatedDuration: number;
  rewardType: 'points' | 'cash' | 'gift_card' | 'none';
  rewardAmount?: number;
  rewardCurrency?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface for Survey creation
export interface SurveyCreationAttributes extends Optional<SurveyAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Survey extends Model<SurveyAttributes, SurveyCreationAttributes> implements SurveyAttributes {
  public id!: number;
  public title!: string;
  public description!: string;
  public questions!: Question[];
  public createdBy!: number;
  public status!: 'draft' | 'active' | 'paused' | 'completed';
  public ageRangeMin?: number;
  public ageRangeMax?: number;
  public targetGender?: string;
  public targetCountries?: string;
  public targetLanguages?: string;
  public maxParticipants?: number;
  public allowAnonymous!: boolean;
  public requireEmail!: boolean;
  public showProgressBar!: boolean;
  public allowBackNavigation!: boolean;
  public autoSave!: boolean;
  public timeLimit?: number;
  public startDate?: Date;
  public endDate?: Date;
  public totalResponses!: number;
  public completedResponses!: number;
  public inProgressResponses!: number;
  public tags!: string;
  public category!: string;
  public estimatedDuration!: number;
  public rewardType!: 'points' | 'cash' | 'gift_card' | 'none';
  public rewardAmount?: number;
  public rewardCurrency?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Virtual for completion rate
  public getCompletionRate(): number {
    if (this.totalResponses === 0) return 0;
    return (this.completedResponses / this.totalResponses) * 100;
  }

  // Get tags as array
  public getTagsArray(): string[] {
    return this.tags ? this.tags.split(',').map(tag => tag.trim()) : [];
  }

  // Set tags from array
  public setTagsArray(tags: string[]): void {
    this.tags = tags.join(', ');
  }

  // Get target countries as array
  public getTargetCountriesArray(): string[] {
    return this.targetCountries ? this.targetCountries.split(',').map(country => country.trim()) : [];
  }

  // Set target countries from array
  public setTargetCountriesArray(countries: string[]): void {
    this.targetCountries = countries.join(', ');
  }

  // Get target languages as array
  public getTargetLanguagesArray(): string[] {
    return this.targetLanguages ? this.targetLanguages.split(',').map(lang => lang.trim()) : [];
  }

  // Set target languages from array
  public setTargetLanguagesArray(languages: string[]): void {
    this.targetLanguages = languages.join(', ');
  }
}

Survey.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 200],
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 1000],
      },
    },
    questions: {
      type: DataTypes.JSON,
      allowNull: false,
      validate: {
        notEmpty: true,
        isValidQuestions(value: Question[]) {
          if (!Array.isArray(value) || value.length === 0) {
            throw new Error('At least one question is required');
          }
        },
      },
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM('draft', 'active', 'paused', 'completed'),
      allowNull: false,
      defaultValue: 'draft',
    },
    ageRangeMin: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
        max: 120,
      },
    },
    ageRangeMax: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
        max: 120,
      },
    },
    targetGender: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    targetCountries: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    targetLanguages: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    maxParticipants: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
      },
    },
    allowAnonymous: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    requireEmail: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    showProgressBar: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    allowBackNavigation: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    autoSave: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    timeLimit: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
      },
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    totalResponses: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    completedResponses: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    inProgressResponses: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    tags: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '',
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    estimatedDuration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    rewardType: {
      type: DataTypes.ENUM('points', 'cash', 'gift_card', 'none'),
      allowNull: false,
      defaultValue: 'none',
    },
    rewardAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0,
      },
    },
    rewardCurrency: {
      type: DataTypes.STRING(3),
      allowNull: true,
      defaultValue: 'USD',
    },
  },
  {
    sequelize,
    tableName: 'surveys',
    modelName: 'Survey',
  }
);

// Define associations
Survey.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(Survey, { foreignKey: 'createdBy', as: 'surveys' });

export default Survey; 