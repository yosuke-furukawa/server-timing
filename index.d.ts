declare module "server-timing" {
  import * as e from "express";
  type Options = {
    name?: string,
    description?: string,
    total?: boolean;
    enabled?: boolean | IsEnabledCheck;
    autoEnd?: boolean;
    precision?: number;
  };
  const _default: (opts?: Options) => e.RequestHandler;
  export default _default;
  type _Response = {
    startTime: (name: string, desc: string) => void;
    endTime: (name: string) => void;
    setMetric: (name: string, value: number, description?: string) => void;
  };
  export type IsEnabledCheck = (req: e.Request, res: e.Response) => boolean
  export type SeverTimingResponse = e.Response & _Response;

  global {
    namespace Express {
      interface Response extends _Response {
      }
    }
  }
}
