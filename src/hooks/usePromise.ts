import React from 'react';
import { Web3Service, Web3ServicePromisableMethods } from 'types';
import isEqual from 'lodash/isEqual';
import usePrevious from 'hooks/usePrevious';
import isUndefined from 'lodash/isUndefined';

function usePromise<T>(
  promise: Web3Service,
  functionName: Web3ServicePromisableMethods,
  parameters: any[] = [],
  skip = false
): [T, boolean, { code: number; message: string }] {
  const [isLoading, setIsLoading] = React.useState(false);
  const [result, setResult] = React.useState<any>(undefined);
  const [error, setError] = React.useState<any>(undefined);
  const prevParameters = usePrevious(parameters);

  React.useEffect(() => {
    async function callPromise() {
      try {
        const promiseResult = await promise[functionName].apply(promise, parameters);
        setResult(promiseResult);
        setError(undefined);
      } catch (e) {
        setError(e);
      }
      setIsLoading(false);
    }

    if (!skip && ((!isLoading && isUndefined(result) && isUndefined(error)) || !isEqual(prevParameters, parameters))) {
      setIsLoading(true);
      setResult(undefined);
      setError(undefined);
      callPromise();
    }
  }, [functionName, parameters, skip, isLoading, result, error]);

  return [result, isLoading, error];
}

export default usePromise;
