import { useCallback, useContext } from "react"
import { AppContext } from "../utils/context"
import { fakeFetch, RegisteredEndpoints } from "../utils/fetch"
import { useWrappedRequest } from "./useWrappedRequest"
import {
  SetTransactionApprovalParams,
  isPaginatedResponse,
  isTransaction,
  Transaction,
} from "../utils/types"

export function useCustomFetch() {
  const { cache } = useContext(AppContext)
  const { loading, wrappedRequest } = useWrappedRequest()

  const fetchWithCache = useCallback(
    async <TData, TParams extends object = object>(
      endpoint: RegisteredEndpoints,
      params?: TParams
    ): Promise<TData | null> =>
      wrappedRequest<TData>(async () => {
        const cacheKey = getCacheKey(endpoint, params)
        const cacheResponse = cache?.current.get(cacheKey)

        if (cacheResponse) {
          const data = JSON.parse(cacheResponse)
          return data as Promise<TData>
        }

        const result = await fakeFetch<TData>(endpoint, params)
        cache?.current.set(cacheKey, JSON.stringify(result))
        return result
      }),
    [cache, wrappedRequest]
  )

  const fetchWithoutCache = useCallback(
    async <TData, TParams extends object = object>(
      endpoint: RegisteredEndpoints,
      params?: TParams
    ): Promise<TData | null> =>
      wrappedRequest<TData>(async () => {
        const result = await fakeFetch<TData>(endpoint, params)
        return result
      }),
    [wrappedRequest]
  )

  const clearCache = useCallback(() => {
    if (cache?.current === undefined) {
      return
    }

    cache.current = new Map<string, string>()
  }, [cache])

  const clearCacheByEndpoint = useCallback(
    (endpointsToClear: RegisteredEndpoints[]) => {
      if (cache?.current === undefined) {
        return
      }

      const cacheKeys = Array.from(cache.current.keys())

      for (const key of cacheKeys) {
        const clearKey = endpointsToClear.some((endpoint) => key.startsWith(endpoint))

        if (clearKey) {
          cache.current.delete(key)
        }
      }
    },
    [cache]
  )

  const updateTransactionApprovalCache = useCallback(
    (params: SetTransactionApprovalParams) => {
      cache?.current.forEach((value: string, key: string, map: Map<string, string>) => {
        let data = JSON.parse(value)

        if (isPaginatedResponse(data)) {
          data.data = updateTransactions(data.data, params)
        } else if (Array.isArray(data)) {
          let isArrayOfTransactions = isTransaction(data[0])

          if (isArrayOfTransactions) {
            data = updateTransactions(data, params)
          }
        }
        map.set(key, JSON.stringify(data))
      })
    },
    [cache]
  )

  return {
    fetchWithCache,
    fetchWithoutCache,
    clearCache,
    updateTransactionApprovalCache,
    clearCacheByEndpoint,
    loading,
  }
}

function getCacheKey(endpoint: RegisteredEndpoints, params?: object) {
  return `${endpoint}${params ? `@${JSON.stringify(params)}` : ""}`
}

function updateTransactions(data: Transaction[], params: SetTransactionApprovalParams) {
  data.forEach((value: Transaction, index: number, array: Transaction[]) => {
    // if this is the transaction that has been updated
    // set its approved status with the new value
    if (value.id === params.transactionId) {
      value.approved = params.value
      array[index] = value
    }
  })
  return data
}
