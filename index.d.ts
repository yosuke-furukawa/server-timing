declare module "server-timing" {
  import * as e from "express";
  type Options = {
    total?: boolean;
    enabled?: boolean;
    autoEnd?: boolean;
  };
  export default (opts?: Options) => e.RequestHandler;
  type Response = {
    startTime: (name: string, desc: string) => void;
    endTime: (name: string) => void;
  };
  export type SeverTimingResponse = e.Response & Response;
}
