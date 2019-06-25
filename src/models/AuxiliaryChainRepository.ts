// Copyright 2019 OpenST Ltd.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// ----------------------------------------------------------------------------

/* eslint-disable class-methods-use-this */

import {
  DataTypes, Model, InitOptions, Op,
} from 'sequelize';
import BigNumber from 'bignumber.js';
import Subject from '../observer/Subject';

class AuxiliaryChainModel extends Model {}

/**
 * To be used for calling any methods which would change states of record(s) in Database.
 */
export interface AuxiliaryChainAttributes {
  chainId: number;
  originChainName: string;
  ostGatewayAddress: string;
  ostCoGatewayAddress: string;
  anchorAddress: string;
  coAnchorAddress: string;
  lastProcessedBlockNumber?: BigNumber;
  lastOriginBlockHeight?: BigNumber;
  lastAuxiliaryBlockHeight?: BigNumber;
}

/**
 * Repository would always return database rows after typecasting to this
 */
export interface AuxiliaryChain extends AuxiliaryChainAttributes {
  createdAt: Date;
  updatedAt: Date;
}

export class AuxiliaryChainRepository extends Subject {
  /* Public Functions */

  public constructor(initOptions: InitOptions) {
    super();

    AuxiliaryChainModel.init(
      {
        chainId: {
          type: DataTypes.INTEGER,
          primaryKey: true,
        },
        originChainName: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            isAlphanumeric: true,
            len: [3, 50],
          },
        },
        ostGatewayAddress: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            isAlphanumeric: true,
            len: [42, 42],
          },
        },
        ostCoGatewayAddress: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            isAlphanumeric: true,
            len: [42, 42],
          },
        },
        anchorAddress: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            isAlphanumeric: true,
            len: [42, 42],
          },
        },
        coAnchorAddress: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            isAlphanumeric: true,
            len: [42, 42],
          },
        },
        lastProcessedBlockNumber: {
          type: DataTypes.BIGINT,
          allowNull: true,
          defaultValue: null,
          validate: {
            min: 0,
          },
        },
        lastOriginBlockHeight: {
          type: DataTypes.BIGINT,
          allowNull: true,
          defaultValue: null,
          validate: {
            min: 0,
          },
        },
        lastAuxiliaryBlockHeight: {
          type: DataTypes.BIGINT,
          allowNull: true,
          defaultValue: null,
          validate: {
            min: 0,
          },
        },
      },
      {
        ...initOptions,
        modelName: 'auxiliaryChain',
        tableName: 'auxiliary_chain',
      },
    );
  }

  /**
   * Creates an auxiliary chain model in the repository and syncs with database.
   * @param {AuxiliaryChainAttributes} auxiliaryChainAttributes
   * @return {Promise<AuxiliaryChain>}
   */
  public async create(auxiliaryChainAttributes: AuxiliaryChainAttributes): Promise<AuxiliaryChain> {
    try {
      const auxiliaryChain: AuxiliaryChain = await AuxiliaryChainModel.create(auxiliaryChainAttributes) as AuxiliaryChain;
      this.format(auxiliaryChain);
      return auxiliaryChain;
    } catch (e) {
      const errorContext = {
        attributes: auxiliaryChainAttributes,
        reason: e.message,
      };
      return Promise.reject(`Failed to create an auxiliary chain: ${JSON.stringify(errorContext)}`);
    }
  }

  /**
   * Fetches auxiliary chain data from database.
   * @param {number} chainId
   * @return {Promise<AuxiliaryChain | null>}
   */
  public async get(chainId: number): Promise<AuxiliaryChain | null> {
    const auxiliaryChainModel = await AuxiliaryChainModel.findOne({
      where: {
        chainId,
      },
    });
    if (auxiliaryChainModel === null) {
      return null;
    }
    const auxiliaryChain: AuxiliaryChain = auxiliaryChainModel;
    this.format(auxiliaryChain);
    return auxiliaryChain;
  }

  /**
   * Updates auxiliary chain data in database and does not return the updated state.
   * @param {AuxiliaryChainAttributes} auxiliaryChainAttributes
   * @return {Promise<number[]>>}
   */
  public async update(auxiliaryChainAttributes: AuxiliaryChainAttributes): Promise<number[]> {
    return await AuxiliaryChainModel.update({
      lastProcessedBlockNumber: auxiliaryChainAttributes.lastProcessedBlockNumber,
      lastOriginBlockHeight: auxiliaryChainAttributes.lastOriginBlockHeight,
      lastAuxiliaryBlockHeight: auxiliaryChainAttributes.lastAuxiliaryBlockHeight,
    }, {
      where: {
        chainId: {
          [Op.eq]: auxiliaryChainAttributes.chainId,
        },
      },
    });
  }

  /**
   * Modifies the auxiliaryChain object by typecasting required properties.
   * @param {AuxiliaryChain} auxiliaryChain
   */
  private format(auxiliaryChain: AuxiliaryChain): void {
    if (auxiliaryChain.lastProcessedBlockNumber) {
      auxiliaryChain.lastProcessedBlockNumber = new BigNumber(auxiliaryChain.lastProcessedBlockNumber);
    }
    if (auxiliaryChain.lastOriginBlockHeight) {
      auxiliaryChain.lastProcessedBlockNumber = new BigNumber(auxiliaryChain.lastOriginBlockHeight);
    }
    if (auxiliaryChain.lastAuxiliaryBlockHeight) {
      auxiliaryChain.lastProcessedBlockNumber = new BigNumber(auxiliaryChain.lastAuxiliaryBlockHeight);
    }
  }
}
