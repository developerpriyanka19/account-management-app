import type { CSSProperties } from "react";

export const DN_FARMER_COL_W = 200;
export const DN_SURVEY_COL_W = 100;
export const DN_ACTION_COL_W = 56;
export const DN_SL_COL_W = 48;
export const DN_ATL_HEADER_H = 32;

/** Below farmer dropdown (z-50) so the list always floats over the table. */
const Z_HEADER = 20;
const Z_HEADER_PINNED = 20;
const Z_BODY_PINNED = 10;

const LEFT_PIN_SHADOW = "4px 0 8px -2px rgba(15,23,42,0.12)";
const RIGHT_PIN_SHADOW = "-4px 0 8px -2px rgba(15,23,42,0.12)";

type StickyOpts = {
  top?: number;
  left?: number;
  right?: number;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  background: string;
  isLastLeftPin?: boolean;
  isFirstRightPin?: boolean;
  zIndex?: number;
};

function baseSticky(opts: StickyOpts): CSSProperties {
  return {
    position: "sticky",
    top: opts.top != null ? `${opts.top}px` : undefined,
    left: opts.left != null ? `${opts.left}px` : undefined,
    right: opts.right != null ? `${opts.right}px` : undefined,
    width: opts.width != null ? `${opts.width}px` : undefined,
    minWidth: opts.minWidth != null ? `${opts.minWidth}px` : undefined,
    maxWidth: opts.maxWidth != null ? `${opts.maxWidth}px` : undefined,
    zIndex: opts.zIndex ?? Z_BODY_PINNED,
    backgroundColor: opts.background,
    backgroundClip: "padding-box",
    boxSizing: "border-box",
    boxShadow: opts.isLastLeftPin
      ? LEFT_PIN_SHADOW
      : opts.isFirstRightPin
        ? RIGHT_PIN_SHADOW
        : undefined,
  };
}

export function dnHeaderScrollStyle(top: number, background: string): CSSProperties {
  return {
    position: "sticky",
    top: `${top}px`,
    zIndex: Z_HEADER,
    backgroundColor: background,
    backgroundClip: "padding-box",
  };
}

export function dnHeaderFarmerStyle(top: number, background: string): CSSProperties {
  return baseSticky({
    top,
    left: 0,
    width: DN_FARMER_COL_W,
    minWidth: DN_FARMER_COL_W,
    maxWidth: DN_FARMER_COL_W,
    background,
    zIndex: Z_HEADER_PINNED,
  });
}

export function dnHeaderSurveyStyle(top: number, background: string): CSSProperties {
  return baseSticky({
    top,
    left: DN_FARMER_COL_W,
    width: DN_SURVEY_COL_W,
    minWidth: DN_SURVEY_COL_W,
    maxWidth: DN_SURVEY_COL_W,
    background,
    isLastLeftPin: true,
    zIndex: Z_HEADER_PINNED,
  });
}

export function dnHeaderActionStyle(top: number, background: string): CSSProperties {
  return baseSticky({
    top,
    right: 0,
    width: DN_ACTION_COL_W,
    minWidth: DN_ACTION_COL_W,
    maxWidth: DN_ACTION_COL_W,
    background,
    isFirstRightPin: true,
    zIndex: Z_HEADER_PINNED,
  });
}

export function dnBodyFarmerStyle(background: string): CSSProperties {
  return baseSticky({
    left: 0,
    width: DN_FARMER_COL_W,
    minWidth: DN_FARMER_COL_W,
    maxWidth: DN_FARMER_COL_W,
    background,
    zIndex: Z_BODY_PINNED,
  });
}

export function dnBodySurveyStyle(background: string): CSSProperties {
  return baseSticky({
    left: DN_FARMER_COL_W,
    width: DN_SURVEY_COL_W,
    minWidth: DN_SURVEY_COL_W,
    maxWidth: DN_SURVEY_COL_W,
    background,
    isLastLeftPin: true,
    zIndex: Z_BODY_PINNED,
  });
}

export function dnBodyActionStyle(background: string): CSSProperties {
  return baseSticky({
    right: 0,
    width: DN_ACTION_COL_W,
    minWidth: DN_ACTION_COL_W,
    maxWidth: DN_ACTION_COL_W,
    background,
    isFirstRightPin: true,
    zIndex: Z_BODY_PINNED,
  });
}

export function dnRowBackground(index: number, variant: "default" | "totals" = "default"): string {
  if (variant === "totals") return "#F9FAFB";
  return index % 2 === 1 ? "#FAFBFC" : "#FFFFFF";
}
