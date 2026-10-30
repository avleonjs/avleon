import "reflect-metadata";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ApiController,
  createControllerDecorator,
  ControllerOptions,
} from "./controller";
import { Service } from "typedi";
import * as containerModule from "../common/container";
import { Service as TypediService } from "typedi";

describe("Controller Decorators", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("ApiController", () => {
    it("should apply metadata and Service decorator when used as a class decorator", () => {
      const registerControllerSpy = vi.spyOn(
        containerModule,
        "registerController",
      );

      @ApiController
      class TestController {}

      expect(
        Reflect.getMetadata(
          containerModule.API_CONTROLLER_METADATA_KEY,
          TestController,
        ),
      ).toBe(true);
      expect(registerControllerSpy).toHaveBeenCalledWith(TestController);
      expect(
        Reflect.getMetadata(
          containerModule.CONTROLLER_META_KEY,
          TestController,
        ),
      ).toEqual({
        type: "api",
        path: "/",
        options: {},
      });
    });

    it("should apply metadata and Service decorator when used with a path", () => {
      const registerControllerSpy = vi.spyOn(
        containerModule,
        "registerController",
      );

      @ApiController("/test")
      class TestController {}

      expect(
        Reflect.getMetadata(
          containerModule.API_CONTROLLER_METADATA_KEY,
          TestController,
        ),
      ).toBe(true);
      expect(registerControllerSpy).toHaveBeenCalledWith(TestController);
      expect(
        Reflect.getMetadata(
          containerModule.CONTROLLER_META_KEY,
          TestController,
        ),
      ).toEqual({
        type: "api",
        path: "/test",
        options: {},
      });
    });

    it("should apply metadata and Service decorator when used with options", () => {
      const registerControllerSpy = vi.spyOn(
        containerModule,
        "registerController",
      );
      const options: ControllerOptions = { name: "Custom", path: "/custom" };

      @ApiController(options)
      class TestController {}

      expect(
        Reflect.getMetadata(
          containerModule.API_CONTROLLER_METADATA_KEY,
          TestController,
        ),
      ).toBe(true);
      expect(registerControllerSpy).toHaveBeenCalledWith(TestController);
      expect(
        Reflect.getMetadata(
          containerModule.CONTROLLER_META_KEY,
          TestController,
        ),
      ).toEqual({
        type: "api",
        path: "/custom",
        options,
      });
    });
  });
});
