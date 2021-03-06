import React from 'react';
import isEqual from 'lodash/isEqual';
import usePrevious from 'hooks/usePrevious';
import { ApolloClient, DocumentNode, NormalizedCacheObject, QueryResult } from '@apollo/client';
import gqlFetchAll from 'utils/gqlFetchAll';
import useDCAGraphql from './useDCAGraphql';

function useGqlFetchAll<T>(
  client: ApolloClient<NormalizedCacheObject> | undefined,
  queryToRun: DocumentNode,
  variables: unknown,
  dataToSearch: string,
  skip = false
): QueryResult<T> | { data: undefined; loading: boolean } {
  const [result, setResult] = React.useState<QueryResult<T> | { data: undefined; loading: boolean }>({
    data: undefined,
    loading: false,
  });
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const prevParameters = usePrevious(variables);
  const defaultClient = useDCAGraphql();
  const clientToUse = client || defaultClient;

  React.useEffect(() => {
    async function callPromise() {
      try {
        const gqlResult = await gqlFetchAll<T>(clientToUse, queryToRun, variables, dataToSearch);
        setResult({ ...gqlResult, loading: false } as never);
      } catch (e) {
        console.error(e);
      }
    }

    if (client && !skip && ((!result.data && !result.loading) || !isEqual(prevParameters, variables))) {
      setResult({ data: undefined, loading: true });
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      callPromise();
    }
  }, [client, queryToRun, variables, skip, result]);

  return result;
}

export default useGqlFetchAll;
