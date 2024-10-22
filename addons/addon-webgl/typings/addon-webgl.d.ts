/**
 * Copyright (c) 2017 The xterm.js authors. All rights reserved.
 * @license MIT
 */

import { Terminal, ITerminalAddon, IEvent } from '@xterm/xterm';
import { IWebGL2RenderingContext } from 'Types';

declare module '@xterm/addon-webgl' {
  /**
   * An xterm.js addon that provides hardware-accelerated rendering functionality via WebGL.
   */
  export class WebglAddon implements ITerminalAddon {
    public textureAtlas?: HTMLCanvasElement;

    /**
     * An event that is fired when the renderer loses its canvas context.
     */
    public readonly onContextLoss: IEvent<void>;

    /**
     * An event that is fired when the texture atlas of the renderer changes.
     */
    public readonly onChangeTextureAtlas: IEvent<HTMLCanvasElement>;

    /**
     * An event that is fired when the a new page is added to the texture atlas.
     */
    public readonly onAddTextureAtlasCanvas: IEvent<HTMLCanvasElement>;

    /**
     * An event that is fired when the a page is removed from the texture atlas.
     */
    public readonly onRemoveTextureAtlasCanvas: IEvent<HTMLCanvasElement>;

    constructor(preserveDrawingBuffer?: boolean);

    /**
     * Activates the addon.
     * @param terminal The terminal the addon is being loaded in.
     */
    public activate(terminal: Terminal): void;

    /**
     * Disposes the addon.
     */
    public dispose(): void;

    /**
     * Clears the terminal's texture atlas and triggers a redraw.
     */
    public clearTextureAtlas(): void;

    /**
     * Callbacks
     */
    public static onInit: ((gl: IWebGL2RenderingContext) => void) | undefined;
    public static onResize: ((cellwidth: number, cellheight: number) => void) | undefined;
    public static onRender: ((texture: WebGLTexture) => void) | undefined;
  }
}
