import { IRenderDimensions } from 'browser/renderer/shared/Types';
import { Disposable } from 'vs/base/common/lifecycle';
import { Terminal } from '@xterm/xterm';
import { IWebGL2RenderingContext } from './Types';
import { WebglAddon } from 'WebglAddon';

export class ShimRenderer extends Disposable {
  private _framebuffer: WebGLFramebuffer | null;
  private _texture: WebGLTexture | null;

  constructor(
    private _terminal: Terminal,
    private _gl: IWebGL2RenderingContext,
    private _dimensions: IRenderDimensions
  ) {
    super();

    this._framebuffer = null;
    this._texture = null;
    //
    // Initialize the framebuffer and texture
    //
    const gl = this._gl;

    // Create the framebuffer
    this._framebuffer = gl.createFramebuffer();
    this._texture = gl.createTexture();
    // TODO: proper cleanup with this._register(toDisposable(() =>

    WebglAddon.onInit?.(gl);
  }

  public handleResize(): void {
    const gl = this._gl;

    gl.bindFramebuffer(gl.FRAMEBUFFER, this._framebuffer);

    // Create a texture to use as the color attachment
    const width = gl.canvas.width;
    const height = gl.canvas.height;

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this._texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    // Attach the texture to the framebuffer as the color attachment
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this._texture, 0);

    // Unbind the framebuffer for now
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);

    WebglAddon.onResize?.(
      this._dimensions.device.cell.width,
      this._dimensions.device.cell.height
    );
  }

  public setDimensions(dimensions: IRenderDimensions): void {
    this._dimensions = dimensions;
  }

  public beginFrame(): void {
    const gl = this._gl;

    gl.bindFramebuffer(gl.FRAMEBUFFER, this._framebuffer);
  }

  public render(): void {
    if (this._texture) {
      const gl = this._gl;
      // Save the atlas texture
      gl.activeTexture(gl.TEXTURE0);
      const savedTexture = gl.getParameter(gl.TEXTURE_BINDING_2D) as WebGLTexture | null;

      WebglAddon.onRender?.(this._texture);

      // Restore the atlas texture
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, savedTexture);
    }
  }
}
