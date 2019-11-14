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


import ApolloClient from 'apollo-client';
import { Observer } from 'apollo-client/util/Observable';
import BigNumber from 'bignumber.js';
import gql from 'graphql-tag';
import sinon from 'sinon';

import ContractEntity, { EntityType } from '../../../src/models/ContractEntity';
import ContractEntityRepository from '../../../src/repositories/ContractEntityRepository';
import GraphClient from '../../../src/subscriptions/GraphClient';
import TransactionFetcher from '../../../src/subscriptions/TransactionFetcher';
import TransactionHandler from '../../../src/TransactionHandler';
import assert from '../../test_utils/assert';
import SpyAssert from '../../test_utils/SpyAssert';

describe('GraphClient.subscribe()', () => {
  let graphClient: GraphClient;
  let subscriptionQry: string;
  let mockApolloClient: any;
  let options: Record<string, any>;
  const transactions = {
    stakeRequesteds: [
      {
        __typename: 'StakeRequested',
        id: '0xf014f7f10591f9ae1386763b0526e6ebc3d2e18f6d288107784cad33ee8c1a2c-0',
        stakeRequestHash: '0x03416b64b90b38dbd09eb4c2b1f2d5d5c6a27c11d016af468e1428460fd3cf19',
        contractAddress: '0x0000000000000000000000000000000000000002',
        uts: 1000,
      },
      {
        __typename: 'StakeRequested',
        id: '0x5c142c836b168ec4ec0017e516449f2af21cbb1159459b833a22efee4d8a2acc-0',
        stakeRequestHash: '0x03416b64b90b38dbd09eb4c2b1f2d5d5c6a27c11d016af468e1428460fd3cf19',
        contractAddress: '0x0000000000000000000000000000000000000002',
        uts: 1001,
      },
    ],
  };
  const subscriptionData = {
    data: transactions,
  };

  beforeEach(() => {
    mockApolloClient = {
      subscribe: sinon.stub(),
    };
    graphClient = new GraphClient(mockApolloClient);
    subscriptionQry = 'subscription{stakeRequesteds{id}}';
    options = {
      fetchPolicy: 'no-cache',
      query: gql`${subscriptionQry}`,
      variables: {},
    };
  });


  it('should work with correct parameters', async () => {
    const mockQuerySubscriber = {
      subscribe: (fakeObserver: Observer<any>) => {
        if (fakeObserver.next) fakeObserver.next(subscriptionData);
        return sinon.fake();
      },
    };
    const mockApolloClientWithFakeSubscriber = sinon.createStubInstance(ApolloClient);
    const spyMethod = sinon.replace(
      mockApolloClientWithFakeSubscriber,
      'subscribe',
      sinon.fake.returns(mockQuerySubscriber) as any,
    );
    graphClient = new GraphClient(mockApolloClientWithFakeSubscriber as any);
    const handler = sinon.createStubInstance(TransactionHandler);
    const fetcher = sinon.createStubInstance(TransactionFetcher);
    const fetcherSpy = sinon.replace(
      fetcher,
      'fetch',
      sinon.fake.resolves(transactions) as any,
    );
    const contractEntityRepository = sinon.createStubInstance(ContractEntityRepository);

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

    SpyAssert.assert(
      spyMethod,
      1,
      [[options]],
    );

    SpyAssert.assert(
      fetcherSpy,
      1,
      [[subscriptionData.data]],
    );

    SpyAssert.assert(
      handler.handle,
      1,
      [[transactions]],
    );

    SpyAssert.assert(
      contractEntityRepository.save,
      1,
      [[new ContractEntity(
        '0x0000000000000000000000000000000000000002',
        EntityType.StakeRequesteds,
        new BigNumber(1001),
      )]],
    );
    sinon.restore();
  });


  it('should not call fetcher when blank transactions are recieved', async () => {
    const mockQuerySubscriber = {
      subscribe: (fakeObserver: Observer<any>) => {
        if (fakeObserver.next) fakeObserver.next({ data: { stakeRequesteds: [] } });
        return sinon.fake();
      },
    };
    const mockApolloClientWithFakeSubscriber = sinon.createStubInstance(ApolloClient);
    const spyMethod = sinon.replace(
      mockApolloClientWithFakeSubscriber,
      'subscribe',
      sinon.fake.returns(mockQuerySubscriber) as any,
    );
    graphClient = new GraphClient(mockApolloClientWithFakeSubscriber as any);
    const handler = sinon.createStubInstance(TransactionHandler);
    const fetcher = sinon.createStubInstance(TransactionFetcher);
    const fetcherSpy = sinon.replace(
      fetcher,
      'fetch',
      sinon.fake.resolves(transactions) as any,
    );
    const contractEntityRepository = sinon.createStubInstance(ContractEntityRepository);

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

    SpyAssert.assert(
      spyMethod,
      1,
      [[options]],
    );

    SpyAssert.assert(
      fetcherSpy,
      0,
      [],
    );

    SpyAssert.assert(
      handler.handle,
      0,
      [],
    );

    SpyAssert.assert(
      contractEntityRepository.save,
      0,
      [],
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
