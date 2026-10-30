/**
 * @copyright 2024
 * @author Tareq Hossain
 * @email xtrinsic96@gmail.com
 * @url https://github.com/xtareq
 */

import { Injectable } from "../di";
export function AppService(target: any): void;
export function AppService(): any;
export function AppService(target?: any) {
  if (target) {
    Injectable()(target);
  } else {
    return function (tg: any) {
      Injectable()(tg);
    };
  }
}

export * from "../http/controller";
export * from "../http/route-methods";
export * from "../openapi/openapi";
export const Utility = Injectable;
export const Helper = Injectable;
export * from "../http/params";
