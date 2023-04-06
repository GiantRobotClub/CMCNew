import { Context } from "koa";

export function getDeck(ctx: Context, next) {
  ctx.params.id;
  ctx.body = "This is the id" + ctx.params.id;
}
