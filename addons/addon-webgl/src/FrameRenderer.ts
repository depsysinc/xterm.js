import { throwIfFalsy } from 'browser/renderer/shared/RendererUtils';
import { IRenderDimensions } from 'browser/renderer/shared/Types';
import { Disposable, toDisposable } from 'vs/base/common/lifecycle';
import { Terminal } from '@xterm/xterm';
import { IRenderModel, IWebGL2RenderingContext, IWebGLVertexArrayObject } from './Types';
import { createProgram, GLTexture, PROJECTION_MATRIX } from './WebglUtils';

const enum VertexAttribLocations {
  POSITION = 0,
}

const vertexShaderSource = `#version 300 es
layout (location = ${VertexAttribLocations.POSITION}) in vec2 a_position;

out vec2 v_texCoord; // Pass texture coordinates to fragment shader

void main() {
    v_texCoord = a_position * 0.5 + 0.5; // Map from [-1,1] to [0,1]
    gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const fragmentShaderSource = `#version 300 es
precision mediump float;

uniform sampler2D u_texture; // Texture sampler
in vec2 v_texCoord;          // Interpolated texture coordinates from vertex shader
out vec4 outColor;           // Output color for the fragment

void main() {
  outColor = texture(u_texture, v_texCoord);
  if (int(gl_FragCoord.y) % 10 == 0) {
      outColor.g += 0.5; // Add 0.5 to the red channel on every fifth row
  }
}`;

export class FrameRenderer extends Disposable {
  private _program: WebGLProgram;
  private _vertexArrayObject: IWebGLVertexArrayObject;
  private _textureLocation: WebGLUniformLocation;
  private _framebuffer: WebGLFramebuffer | null;
  private _texture: WebGLTexture | null;
  private _quadBuffer: WebGLBuffer | null;

constructor(
    private _terminal: Terminal,
    private _gl: IWebGL2RenderingContext,
    private _dimensions: IRenderDimensions,

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

  this._vertexArrayObject = gl.createVertexArray();
  gl.bindVertexArray(this._vertexArrayObject);

  // Create a buffer for the fullscreen quad's vertices
  const vertices = new Float32Array([
      -1, -1, // Bottom left
       1, -1, // Bottom right
      -1,  1, // Top left
       1,  1  // Top right
  ]);

  this._quadBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this._quadBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  this._program = throwIfFalsy(createProgram(gl, vertexShaderSource, fragmentShaderSource));
  this._register(toDisposable(() => gl.deleteProgram(this._program)));

  this._textureLocation = throwIfFalsy(gl.getUniformLocation(this._program, 'u_texture'));

  // Define the vertex attribute pointer for position within the VAO
  gl.enableVertexAttribArray(VertexAttribLocations.POSITION);
  gl.vertexAttribPointer(VertexAttribLocations.POSITION, 2, gl.FLOAT, false, 0, 0);

  this.handleResize();
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

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  // Attach the texture to the framebuffer as the color attachment
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this._texture, 0);

  // Unbind the framebuffer for now
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.bindTexture(gl.TEXTURE_2D, null);
}

public setDimensions(dimensions: IRenderDimensions): void {
  this._dimensions = dimensions;
}

public beginFrame(): void {
  const gl = this._gl;

  gl.bindFramebuffer(gl.FRAMEBUFFER, this._framebuffer);
}

public render(): void {
  console.log("RENDER");
  const gl = this._gl;

  // Bind the default framebuffer (null)
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  // Clear the screen if needed
  gl.clearColor(1.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Use the fullscreen shader program
  gl.useProgram(this._program);

  // Bind the VAO for the fullscreen quad
  gl.bindVertexArray(this._vertexArrayObject);

  // Bind the texture as the active texture
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, this._texture);
  gl.uniform1i(this._textureLocation, 0); // Set the texture uniform to use texture unit 0

  // Draw the fullscreen quad
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

  // Unbind the VAO and texture after rendering
  gl.bindTexture(gl.TEXTURE_2D, null);

}


};
