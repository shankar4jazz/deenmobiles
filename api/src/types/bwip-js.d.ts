declare module 'bwip-js' {
  export interface ToBufferOptions {
    bcid: string;
    text: string;
    scale?: number;
    height?: number;
    width?: number;
    includetext?: boolean;
    textxalign?: string;
    textyalign?: string;
    textfont?: string;
    textsize?: number;
    textgaps?: number;
    alttext?: string;
    showborder?: boolean;
    borderwidth?: number;
    borderleft?: number;
    borderright?: number;
    bordertop?: number;
    borderbottom?: number;
    barcolor?: string;
    backgroundcolor?: string;
    bordercolor?: string;
    textcolor?: string;
    padding?: number;
    paddingleft?: number;
    paddingright?: number;
    paddingtop?: number;
    paddingbottom?: number;
    rotate?: 'N' | 'R' | 'L' | 'I';
  }

  export function toBuffer(options: ToBufferOptions): Promise<Buffer>;
}
