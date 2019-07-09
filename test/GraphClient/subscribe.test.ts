import gql from 'graphql-tag';
import * as sinon from 'sinon';
import assert from '../test_utils/assert';

import GraphClient from '../../src/GraphClient';
import SpyAssert from '../test_utils/SpyAssert';
import TransactionHandler from '../../src/TransactionHandler';
import TransactionFetcher from '../../src/TransactionFetcher';
import { ContractEntityRepository } from '../../src/repositories/ContractEntityRepository';

describe('GraphClient.subscribe()', () => {
  let graphClient: GraphClient;
  let subscriptionQry: string;
  let mockApolloClient: any;
  let options: Record<string, any>;

  beforeEach(() => {
    mockApolloClient = {
      subscribe: sinon.stub(),
    };
    graphClient = new GraphClient(mockApolloClient);
    subscriptionQry = 'subscription{stakeRequesteds{id}}';
    options = {
      query: gql`${subscriptionQry}`,
      variables: {},
    };
  });

  it('should work with correct parameters', async () => {
    const mockQuerySubscriber = sinon.spy() as any;
    const spyMethod = sinon.replace(
      mockApolloClient,
      'subscribe',
      sinon.fake.returns({
        subscribe: async () => Promise.resolve(mockQuerySubscriber),
      }),
    );
    const handler = sinon.mock(TransactionHandler);
    const fetcher = sinon.mock(TransactionFetcher);
    const contractEntityRepository = sinon.mock(ContractEntityRepository);
    const querySubscriber = await graphClient.subscribe(
      subscriptionQry,
      handler as any,
      fetcher as any,
      contractEntityRepository as any,
    );

    assert(
      querySubscriber,
      'Invalid query subscription object.',
    );

    assert.strictEqual(
      querySubscriber,
      mockQuerySubscriber,
      'Invalid querySubscriber.',
    );

    SpyAssert.assert(
      spyMethod,
      1,
      [[options]],
    );

    sinon.restore();
  });

  it('should throw an error when subscriptionQry is undefined object', async () => {
    const handler = sinon.mock(TransactionHandler);
    const fetcher = sinon.mock(TransactionFetcher);
    const contractEntityRepository = sinon.mock(ContractEntityRepository);
    assert.isRejected(
      graphClient.subscribe(
        undefined as any,
        handler as any,
        fetcher as any,
        contractEntityRepository as any,
      ),
      'Mandatory Parameter \'subscriptionQry\' is missing or invalid.',
      'Invalid subscriptionQry',
    );
  });
});
