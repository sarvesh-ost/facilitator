import GraphClient from './GraphClient';
import EntityGraphQueries from './EntityGraphQueries';
import { ContractEntityRepository } from './repositories/ContractEntityRepository';
import Logger from './Logger';

/**
 * The class fetches the transactions based on contract address and uts.
 */
export default class TransactionFetcher {
  private readonly graphClient: GraphClient;

  private readonly queryLimit = 100;

  private contractEntityRepository: ContractEntityRepository;

  /**
   * Constructor
   * @param graphClient Graph client object.
   * @param contractEntityRepository ContractEntityRepository.
   */
  public constructor(graphClient: GraphClient, contractEntityRepository: ContractEntityRepository) {
    this.graphClient = graphClient;
    this.contractEntityRepository = contractEntityRepository;
  }

  /**
   * Queries graph node.
   *
   * @param data Data received from subscription.
   * @return Graph query response from graph node.
   */
  public async fetch(data: Record<string, any[]>): Promise<{[key: string]: object[]}> {
    const entity = (Object.keys(data)[0]);
    const entityRecord = data[entity][0];
    const query = EntityGraphQueries[entity];

    const contractEntityRecord = await this.contractEntityRepository.get(
      entityRecord.contractAddress,
      entity,
    );

    const uts = contractEntityRecord ? contractEntityRecord.timestamp : 0;
    Logger.info(`Querying records for ${entity} for UTS ${uts}`);
    let skip = 0;
    let transactions: object[] = [];
    const response: any = {};
    while (true) {
      const variables = {
        contractAddress: entityRecord.contractAddress,
        uts,
        limit: this.queryLimit,
        skip,
      };
      /* eslint-disable no-await-in-loop */
      // Note: await is needed here because GraphQL doesn't support aggregated count query.
      const graphQueryResult = await this.graphClient.query(query, variables);
      if (graphQueryResult.data[entity].length === 0) break;
      transactions = transactions.concat(graphQueryResult.data[entity]);
      skip += this.queryLimit;
    }

    response[entity] = transactions;
    return response;
  }
}
