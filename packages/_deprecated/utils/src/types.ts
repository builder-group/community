export type THexColor = `#${string}`;
export type TRgbColor = [number, number, number];
export type TRgbaColor = [number, number, number, number];
export type TColor = THexColor | TRgbColor | TRgbaColor;

/**
 * A 3x3 column majfor matrix.
 */
export type TMat3 = [TVec3, TVec3, TVec3];

/**
 * A 2x2 column majfor matrix.
 */
export type TMat2 = [TVec2, TVec2];

/**
 * A 2-dimensional vector.
 */
export type TVec2 = [number, number];

/**
 * A 3-dimensional vector.
 */
export type TVec3 = [number, number, number];
