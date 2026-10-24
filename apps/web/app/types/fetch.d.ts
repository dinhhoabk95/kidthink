import type { RouterMethod } from "h3";
import type { NitroFetchRequest } from "nitropack/types";
import type { Ref } from "vue";
import type { AsyncData, KeysOf, PickFrom } from "#app/composables/asyncData";
import type { NuxtError } from "#app/composables/error";
import type { FetchResult, UseFetchOptions } from "#app/composables/fetch";

/**
 * Khi `InternalApi` của Nitro vượt quá ~150 route, gọi `useFetch<ResT>(url)` với
 * 1 tham số kiểu làm `ReqT` rơi về mặc định `NitroFetchRequest` (hợp của toàn bộ
 * 160+ route), khiến `AvailableRouterMethod<NitroFetchRequest>` đệ quy vượt ngưỡng
 * `TS2589` và hạ kết quả về `any`. Đặt mặc định `ReqT = string` giữ nguyên suy kiểu
 * tự động khi gọi `useFetch(url)` không truyền `<ResT>`, đồng thời chặn đệ quy
 * tổ hợp khi truyền `<ResT>` tường minh.
 */
declare module "#app/composables/fetch" {
  interface UseFetch<FDataT, FPickKeys, FDefaultT> {
    <
      ResT = void,
      ErrorT = NuxtError,
      ReqT extends NitroFetchRequest = string,
      Method extends RouterMethod = "get",
      _ResT = ResT extends void ? FetchResult<ReqT, Method> : ResT,
      DataT = _ResT,
      PickKeys extends KeysOf<DataT> = KeysOf<DataT>,
      DefaultT = undefined,
    >(
      request: Ref<ReqT> | ReqT | (() => ReqT),
      opts?: UseFetchOptions<_ResT, DataT, PickKeys, DefaultT, string, Method>
    ): AsyncData<PickFrom<DataT, PickKeys> | DefaultT, ErrorT | undefined>;
    <
      ResT = void,
      ErrorT = NuxtError,
      ReqT extends NitroFetchRequest = string,
      Method extends RouterMethod = "get",
      _ResT = ResT extends void ? FetchResult<ReqT, Method> : ResT,
      DataT = _ResT,
      PickKeys extends KeysOf<DataT> = KeysOf<DataT>,
      DefaultT = undefined,
    >(
      request: Ref<ReqT> | ReqT | (() => ReqT),
      arg1?: string,
      arg2?: string
    ): AsyncData<PickFrom<DataT, PickKeys> | DefaultT, ErrorT | undefined>;
  }
}
