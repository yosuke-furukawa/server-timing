declare module "server-timing" {
  import * as e from "express";
  type Options = {
    total?: boolean;
    enabled?: boolean | IsEnabledCheck;
    autoEnd?: boolean;
  };
  const _default: (opts?: Options) => e.RequestHandler;
  export default _default;
  type Response = {
    startTime: (name: string, desc: string) => void;
    endTime: (name: string) => void;
  };
  export type IsEnabledCheck = (req: e.Request, res: e.Response) => boolean
  export type SeverTimingResponse = e.Response & Response;
}
