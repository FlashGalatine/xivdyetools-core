/**
 * RYB (Red-Yellow-Blue) Subtractive Color Mixing
 *
 * Implements the Gossett-Chen algorithm from their 2006 paper
 * "Paint Inspired Color Mixing and Compositing for Visualization"
 *
 * Uses trilinear interpolation in a 3D color cube to convert between
 * RYB and RGB color spaces, enabling intuitive "paint-like" color mixing.
 *
 * Key insight: In RYB (subtractive mixing):
 * - Red + Yellow = Orange
 * - Yellow + Blue = Green
 * - Red + Blue = Violet
 *
 * This differs from RGB (additive mixing) where Blue + Yellow = Gray.
 *
 * @module services/color/RybColorMixer
 */

import type { RGB, HexColor } from '../../types/index.js';
import { clamp } from '../../utils/index.js';
import { ColorConverter } from './ColorConverter.js';

/**
 * RYB color type (Red, Yellow, Blue) with values 0-255
 */
export interface RYB {
  r: number;
  y: number;
  b: number;
}

/**
 * Normalized RGB for internal calculations (0-1 range)
 */
interface RGBNormalized {
  r: number;
  g: number;
  b: number;
}

/**
 * RYB Cube Corner Values (Gossett-Chen)
 *
 * These define the 8 corners of the RYB color cube and their
 * corresponding RGB values. The cube is indexed by [R,Y,B] coordinates.
 *
 * The blue corner is adjusted (r=0.165) to shift the hue and prevent
 * "flat spots" in the spectrum. Similarly, green and violet primaries
 * are tuned for more intuitive color mixing.
 */
const RYB_CORNERS: { [key: string]: RGBNormalized } = {
  '0,0,0': { r: 0.0, g: 0.0, b: 0.0 }, // Black
  '1,0,0': { r: 1.0, g: 0.0, b: 0.0 }, // Red
  '0,1,0': { r: 1.0, g: 1.0, b: 0.0 }, // Yellow
  '0,0,1': { r: 0.165, g: 0.0, b: 1.0 }, // Blue (hue-shifted)
  '1,1,0': { r: 1.0, g: 0.647, b: 0.0 }, // Orange (R+Y)
  '1,0,1': { r: 0.757, g: 0.0, b: 1.0 }, // Violet (R+B)
  '0,1,1': { r: 0.0, g: 1.0, b: 0.349 }, // Green (Y+B)
  '1,1,1': { r: 1.0, g: 1.0, b: 1.0 }, // White
};

/**
 * RYB Color Mixer
 *
 * Provides methods for RYB ↔ RGB conversion and paint-like color mixing.
 */
export class RybColorMixer {
  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Mix two colors using RYB subtractive color mixing
   *
   * This produces results similar to mixing physical paints:
   * - Blue + Yellow = Green (not gray like in RGB)
   * - Red + Yellow = Orange
   * - Red + Blue = Violet
   *
   * @param hex1 First hex color
   * @param hex2 Second hex color
   * @param ratio Mix ratio (0 = all hex1, 0.5 = equal mix, 1 = all hex2). Default: 0.5
   * @returns Mixed color as hex
   *
   * @example
   * // Mix blue and yellow to get green
   * RybColorMixer.mixColors('#0000FF', '#FFFF00') // Returns greenish color
   */
  static mixColors(hex1: string, hex2: string, ratio: number = 0.5): HexColor {
    ratio = clamp(ratio, 0, 1);

    // Convert hex → RGB → RYB
    const rgb1 = ColorConverter.hexToRgb(hex1);
    const rgb2 = ColorConverter.hexToRgb(hex2);

    const ryb1 = this.rgbToRyb(rgb1.r, rgb1.g, rgb1.b);
    const ryb2 = this.rgbToRyb(rgb2.r, rgb2.g, rgb2.b);

    // Linear interpolation in RYB space
    const mixedRyb: RYB = {
      r: Math.round(ryb1.r + (ryb2.r - ryb1.r) * ratio),
      y: Math.round(ryb1.y + (ryb2.y - ryb1.y) * ratio),
      b: Math.round(ryb1.b + (ryb2.b - ryb1.b) * ratio),
    };

    // Convert RYB → RGB → hex
    const mixedRgb = this.rybToRgb(mixedRyb.r, mixedRyb.y, mixedRyb.b);
    return ColorConverter.rgbToHex(mixedRgb.r, mixedRgb.g, mixedRgb.b);
  }

  /**
   * Convert RYB to RGB using trilinear interpolation
   *
   * Uses the Gossett-Chen cube corner values to interpolate
   * any point within the RYB color space to its RGB equivalent.
   *
   * @param r Red component (0-255)
   * @param y Yellow component (0-255)
   * @param b Blue component (0-255)
   * @returns RGB color
   *
   * @example
   * // Convert RYB yellow+blue (green) to RGB
   * RybColorMixer.rybToRgb(0, 255, 255) // Returns { r: 0, g: 255, b: 89 }
   */
  static rybToRgb(r: number, y: number, b: number): RGB {
    // Normalize to 0-1 range
    const rNorm = clamp(r / 255, 0, 1);
    const yNorm = clamp(y / 255, 0, 1);
    const bNorm = clamp(b / 255, 0, 1);

    const result = this.trilinearInterpolate(rNorm, yNorm, bNorm);

    return {
      r: Math.round(clamp(result.r * 255, 0, 255)),
      g: Math.round(clamp(result.g * 255, 0, 255)),
      b: Math.round(clamp(result.b * 255, 0, 255)),
    };
  }

  /**
   * Convert RGB to RYB using Newton-Raphson iterative approximation
   *
   * Since RYB→RGB is non-linear, there's no closed-form inverse.
   * This method uses gradient descent with a numerical Jacobian to find
   * the RYB values that produce the target RGB color.
   *
   * The Jacobian is computed numerically because the RYB→RGB mapping
   * has cross-dependencies (e.g., Yellow affects both R and G in RGB).
   *
   * @param r Red component (0-255)
   * @param g Green component (0-255)
   * @param b Blue component (0-255)
   * @returns RYB color
   *
   * @example
   * // Convert RGB green to RYB
   * RybColorMixer.rgbToRyb(0, 255, 0) // Returns approximately { r: 0, y: ~200, b: ~200 }
   */
  static rgbToRyb(r: number, g: number, b: number): RYB {
    // Normalize target RGB to 0-1
    const targetR = clamp(r / 255, 0, 1);
    const targetG = clamp(g / 255, 0, 1);
    const targetB = clamp(b / 255, 0, 1);

    // Initial guess: start from center of cube and adjust
    // Using a smarter initial guess based on observed RYB→RGB mappings
    let rybR = targetR * 0.5;
    let rybY = targetG * 0.8;
    let rybB = targetB * 0.8;

    // Iterative refinement using Newton-Raphson with numerical Jacobian
    const maxIterations = 100;
    const tolerance = 0.0005;
    const epsilon = 0.001; // For numerical Jacobian

    for (let i = 0; i < maxIterations; i++) {
      // Convert current RYB guess to RGB
      const currentRgb = this.trilinearInterpolate(rybR, rybY, rybB);

      // Calculate error
      const errorR = targetR - currentRgb.r;
      const errorG = targetG - currentRgb.g;
      const errorB = targetB - currentRgb.b;

      // Check convergence
      const errorMagnitude = Math.sqrt(errorR * errorR + errorG * errorG + errorB * errorB);
      if (errorMagnitude < tolerance) {
        break;
      }

      // Compute numerical Jacobian: J[i][j] = ∂RGB[i]/∂RYB[j]
      const J = this.computeJacobian(rybR, rybY, rybB, epsilon);

      // Solve J × delta = error using Cramer's rule
      const delta = this.solveLinearSystem(J, errorR, errorG, errorB);

      // Apply damped Newton-Raphson update
      // Use adaptive damping based on iteration
      const damping = i < 20 ? 0.8 : 0.5;
      rybR = clamp(rybR + delta[0] * damping, 0, 1);
      rybY = clamp(rybY + delta[1] * damping, 0, 1);
      rybB = clamp(rybB + delta[2] * damping, 0, 1);
    }

    return {
      r: Math.round(rybR * 255),
      y: Math.round(rybY * 255),
      b: Math.round(rybB * 255),
    };
  }

  /**
   * Compute the 3×3 Jacobian matrix numerically using finite differences
   *
   * J[i][j] = ∂RGB[i]/∂RYB[j]
   *
   * @param r Current RYB red (0-1)
   * @param y Current RYB yellow (0-1)
   * @param b Current RYB blue (0-1)
   * @param epsilon Step size for finite differences
   * @returns 3×3 Jacobian matrix as [row][col]
   * @internal
   */
  private static computeJacobian(r: number, y: number, b: number, epsilon: number): number[][] {
    const J: number[][] = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];

    // Perturb RYB Red
    const rPlus = this.trilinearInterpolate(Math.min(r + epsilon, 1), y, b);
    const rMinus = this.trilinearInterpolate(Math.max(r - epsilon, 0), y, b);
    const rDenom = Math.min(r + epsilon, 1) - Math.max(r - epsilon, 0);
    if (rDenom > 0) {
      J[0][0] = (rPlus.r - rMinus.r) / rDenom;
      J[1][0] = (rPlus.g - rMinus.g) / rDenom;
      J[2][0] = (rPlus.b - rMinus.b) / rDenom;
    }

    // Perturb RYB Yellow
    const yPlus = this.trilinearInterpolate(r, Math.min(y + epsilon, 1), b);
    const yMinus = this.trilinearInterpolate(r, Math.max(y - epsilon, 0), b);
    const yDenom = Math.min(y + epsilon, 1) - Math.max(y - epsilon, 0);
    if (yDenom > 0) {
      J[0][1] = (yPlus.r - yMinus.r) / yDenom;
      J[1][1] = (yPlus.g - yMinus.g) / yDenom;
      J[2][1] = (yPlus.b - yMinus.b) / yDenom;
    }

    // Perturb RYB Blue
    const bPlus = this.trilinearInterpolate(r, y, Math.min(b + epsilon, 1));
    const bMinus = this.trilinearInterpolate(r, y, Math.max(b - epsilon, 0));
    const bDenom = Math.min(b + epsilon, 1) - Math.max(b - epsilon, 0);
    if (bDenom > 0) {
      J[0][2] = (bPlus.r - bMinus.r) / bDenom;
      J[1][2] = (bPlus.g - bMinus.g) / bDenom;
      J[2][2] = (bPlus.b - bMinus.b) / bDenom;
    }

    return J;
  }

  /**
   * Solve a 3×3 linear system Ax = b using Cramer's rule
   *
   * @param A 3×3 matrix
   * @param b1 First component of b vector
   * @param b2 Second component of b vector
   * @param b3 Third component of b vector
   * @returns Solution vector [x1, x2, x3]
   * @internal
   */
  private static solveLinearSystem(
    A: number[][],
    b1: number,
    b2: number,
    b3: number
  ): [number, number, number] {
    // Calculate determinant of A
    const detA =
      A[0][0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) -
      A[0][1] * (A[1][0] * A[2][2] - A[1][2] * A[2][0]) +
      A[0][2] * (A[1][0] * A[2][1] - A[1][1] * A[2][0]);

    // If matrix is singular, fall back to simple diagonal approximation
    if (Math.abs(detA) < 1e-10) {
      // Use diagonal elements as fallback
      const x1 = A[0][0] !== 0 ? b1 / A[0][0] : 0;
      const x2 = A[1][1] !== 0 ? b2 / A[1][1] : 0;
      const x3 = A[2][2] !== 0 ? b3 / A[2][2] : 0;
      return [x1, x2, x3];
    }

    // Cramer's rule: replace column i with b, compute det, divide by detA
    // x1 = det(A with col 0 replaced by b) / detA
    const detA1 =
      b1 * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) -
      A[0][1] * (b2 * A[2][2] - A[1][2] * b3) +
      A[0][2] * (b2 * A[2][1] - A[1][1] * b3);

    // x2 = det(A with col 1 replaced by b) / detA
    const detA2 =
      A[0][0] * (b2 * A[2][2] - A[1][2] * b3) -
      b1 * (A[1][0] * A[2][2] - A[1][2] * A[2][0]) +
      A[0][2] * (A[1][0] * b3 - b2 * A[2][0]);

    // x3 = det(A with col 2 replaced by b) / detA
    const detA3 =
      A[0][0] * (A[1][1] * b3 - b2 * A[2][1]) -
      A[0][1] * (A[1][0] * b3 - b2 * A[2][0]) +
      b1 * (A[1][0] * A[2][1] - A[1][1] * A[2][0]);

    return [detA1 / detA, detA2 / detA, detA3 / detA];
  }

  /**
   * Convert hex color to RYB
   *
   * @param hex Hex color string
   * @returns RYB color
   */
  static hexToRyb(hex: string): RYB {
    const rgb = ColorConverter.hexToRgb(hex);
    return this.rgbToRyb(rgb.r, rgb.g, rgb.b);
  }

  /**
   * Convert RYB to hex color
   *
   * @param r Red component (0-255)
   * @param y Yellow component (0-255)
   * @param b Blue component (0-255)
   * @returns Hex color string
   */
  static rybToHex(r: number, y: number, b: number): HexColor {
    const rgb = this.rybToRgb(r, y, b);
    return ColorConverter.rgbToHex(rgb.r, rgb.g, rgb.b);
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  /**
   * Trilinear interpolation within the RYB color cube
   *
   * Given normalized RYB coordinates (0-1), interpolates between
   * the 8 corner RGB values to produce the output RGB color.
   *
   * @param r Normalized red (0-1)
   * @param y Normalized yellow (0-1)
   * @param b Normalized blue (0-1)
   * @returns Normalized RGB (0-1)
   * @internal
   */
  private static trilinearInterpolate(r: number, y: number, b: number): RGBNormalized {
    // Get the 8 corner values
    const c000 = RYB_CORNERS['0,0,0'];
    const c100 = RYB_CORNERS['1,0,0'];
    const c010 = RYB_CORNERS['0,1,0'];
    const c110 = RYB_CORNERS['1,1,0'];
    const c001 = RYB_CORNERS['0,0,1'];
    const c101 = RYB_CORNERS['1,0,1'];
    const c011 = RYB_CORNERS['0,1,1'];
    const c111 = RYB_CORNERS['1,1,1'];

    // Interpolate along R axis (between r=0 and r=1 planes)
    const c00 = this.lerpRgb(c000, c100, r);
    const c01 = this.lerpRgb(c001, c101, r);
    const c10 = this.lerpRgb(c010, c110, r);
    const c11 = this.lerpRgb(c011, c111, r);

    // Interpolate along Y axis
    const c0 = this.lerpRgb(c00, c10, y);
    const c1 = this.lerpRgb(c01, c11, y);

    // Interpolate along B axis (final result)
    return this.lerpRgb(c0, c1, b);
  }

  /**
   * Linear interpolation between two RGB colors
   *
   * @param a First color
   * @param b Second color
   * @param t Interpolation factor (0 = a, 1 = b)
   * @returns Interpolated color
   * @internal
   */
  private static lerpRgb(a: RGBNormalized, b: RGBNormalized, t: number): RGBNormalized {
    return {
      r: a.r + (b.r - a.r) * t,
      g: a.g + (b.g - a.g) * t,
      b: a.b + (b.b - a.b) * t,
    };
  }
}
