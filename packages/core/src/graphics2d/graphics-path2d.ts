import { rendering2dLimits } from '../../../../src/data/rendering2d.js';
import type {
  Texture2DSource,
  TextureView2D,
} from '../../../assets/src/index.js';
import type { Rect2D } from '../gameplay/contracts.js';

export type Affine2D = readonly [
  number,
  number,
  number,
  number,
  number,
  number,
];
export type PathCommand2D =
  | { readonly op: 'moveTo' | 'lineTo'; readonly x: number; readonly y: number }
  | {
      readonly op: 'quadraticCurveTo';
      readonly cpx: number;
      readonly cpy: number;
      readonly x: number;
      readonly y: number;
    }
  | {
      readonly op: 'bezierCurveTo';
      readonly cp1x: number;
      readonly cp1y: number;
      readonly cp2x: number;
      readonly cp2y: number;
      readonly x: number;
      readonly y: number;
    }
  | {
      readonly op: 'arc';
      readonly x: number;
      readonly y: number;
      readonly radius: number;
      readonly startAngle: number;
      readonly endAngle: number;
      readonly counterclockwise?: boolean;
    }
  | {
      readonly op: 'ellipse';
      readonly x: number;
      readonly y: number;
      readonly radiusX: number;
      readonly radiusY: number;
      readonly rotation?: number;
      readonly startAngle?: number;
      readonly endAngle?: number;
      readonly counterclockwise?: boolean;
    }
  | {
      readonly op: 'rect' | 'roundedRect';
      readonly x: number;
      readonly y: number;
      readonly width: number;
      readonly height: number;
      readonly radius?: number;
    }
  | {
      readonly op: 'circle';
      readonly x: number;
      readonly y: number;
      readonly radius: number;
    }
  | {
      readonly op: 'polygon';
      readonly points: readonly (readonly [number, number])[];
    }
  | { readonly op: 'svg'; readonly data: string }
  | { readonly op: 'closePath' };
export type Paint2D =
  | string
  | {
      readonly kind: 'linear-gradient';
      readonly from: readonly [number, number];
      readonly to: readonly [number, number];
      readonly stops: readonly {
        readonly offset: number;
        readonly color: string;
      }[];
    }
  | {
      readonly kind: 'radial-gradient';
      readonly from: readonly [number, number, number];
      readonly to: readonly [number, number, number];
      readonly stops: readonly {
        readonly offset: number;
        readonly color: string;
      }[];
    }
  | {
      readonly kind: 'pattern';
      readonly texture?: Texture2DSource;
      readonly view?: TextureView2D;
      readonly repetition?: 'repeat' | 'repeat-x' | 'repeat-y' | 'no-repeat';
      readonly transform?: Affine2D;
    };
export interface Stroke2D {
  readonly paint: Paint2D;
  readonly width: number;
  readonly cap?: CanvasLineCap;
  readonly join?: CanvasLineJoin;
  readonly miterLimit?: number;
}
export interface GraphicsInstruction2D {
  readonly path: GraphicsPath2D;
  readonly fill?: Paint2D;
  readonly stroke?: Stroke2D;
  readonly alpha?: number;
}

const commandFields: Record<PathCommand2D['op'], readonly string[]> = {
  moveTo: ['x', 'y'],
  lineTo: ['x', 'y'],
  quadraticCurveTo: ['cpx', 'cpy', 'x', 'y'],
  bezierCurveTo: ['cp1x', 'cp1y', 'cp2x', 'cp2y', 'x', 'y'],
  arc: ['x', 'y', 'radius', 'startAngle', 'endAngle'],
  ellipse: ['x', 'y', 'radiusX', 'radiusY'],
  circle: ['x', 'y', 'radius'],
  rect: ['x', 'y', 'width', 'height'],
  roundedRect: ['x', 'y', 'width', 'height'],
  polygon: [],
  svg: [],
  closePath: [],
};
function validateCommand(command: PathCommand2D): void {
  if (!command || !Object.hasOwn(commandFields, command.op))
    throw new RangeError('Unsupported GraphicsPath2D command.');
  const record = command as unknown as Record<string, unknown>;
  for (const key of commandFields[command.op])
    if (typeof record[key] !== 'number' || !Number.isFinite(record[key]))
      throw new RangeError(
        'GraphicsPath2D requires finite numeric command fields.',
      );
  for (const value of Object.values(command))
    if (
      typeof value === 'number' &&
      (!Number.isFinite(value) ||
        Math.abs(value) > rendering2dLimits.coordinate)
    )
      throw new RangeError(
        'GraphicsPath2D coordinates must be bounded and finite.',
      );
  for (const key of ['rotation', 'startAngle', 'endAngle', 'radius'])
    if (
      Object.hasOwn(record, key) &&
      record[key] !== undefined &&
      (typeof record[key] !== 'number' || !Number.isFinite(record[key]))
    )
      throw new RangeError('Invalid optional path coordinate.');
  if (
    Object.hasOwn(record, 'counterclockwise') &&
    record['counterclockwise'] !== undefined &&
    typeof record['counterclockwise'] !== 'boolean'
  )
    throw new TypeError('Path counterclockwise must be boolean.');
}

function validateSVG(data: string): number {
  if (
    typeof data !== 'string' ||
    data.length > rendering2dLimits.pathCommands * 32 ||
    !data.trim()
  )
    throw new RangeError('SVG path data must be bounded and nonempty.');
  const tokens =
    data.match(/[a-zA-Z]|[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/g) ?? [];
  if (
    data.replace(
      /[a-zA-Z]|[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?|[\s,]/g,
      '',
    ) ||
    !/^[mM]$/.test(tokens[0] ?? '')
  )
    throw new RangeError('Invalid SVG path syntax.');
  const arities: Record<string, number> = {
    M: 2,
    L: 2,
    H: 1,
    V: 1,
    C: 6,
    S: 4,
    Q: 4,
    T: 2,
    A: 7,
    Z: 0,
  };
  let index = 0,
    command = '',
    count = 0;
  while (index < tokens.length) {
    if (/^[a-zA-Z]$/.test(tokens[index]!)) command = tokens[index++]!;
    const arity = arities[command.toUpperCase()];
    if (arity === undefined || ++count > rendering2dLimits.pathCommands)
      throw new RangeError('Invalid or over-budget SVG path command.');
    if (arity === 0) {
      command = '';
      continue;
    }
    const values: number[] = [];
    for (let i = 0; i < arity; i++) {
      const token = tokens[index++];
      if (!token || /^[a-zA-Z]$/.test(token))
        throw new RangeError('Incomplete SVG path command.');
      const value = Number(token);
      if (
        !Number.isFinite(value) ||
        Math.abs(value) > rendering2dLimits.coordinate
      )
        throw new RangeError('SVG coordinates must be bounded and finite.');
      values.push(value);
    }
    if (
      command.toUpperCase() === 'A' &&
      (values[0]! < 0 ||
        values[1]! < 0 ||
        (values[3] !== 0 && values[3] !== 1) ||
        (values[4] !== 0 && values[4] !== 1))
    )
      throw new RangeError('Invalid SVG arc radius or flags.');
    if (command === 'M') command = 'L';
    else if (command === 'm') command = 'l';
  }
  return count;
}

/** SVG path-only counterpart of native Canvas commands for semantic clipping. */
function serializeCommands(commands: readonly PathCommand2D[]): string {
  const pieces: string[] = [];
  let current = false;
  for (const command of commands) {
    switch (command.op) {
      case 'moveTo':
        pieces.push(`M${command.x} ${command.y}`);
        current = true;
        break;
      case 'lineTo':
        pieces.push(`${current ? 'L' : 'M'}${command.x} ${command.y}`);
        current = true;
        break;
      case 'quadraticCurveTo':
        if (!current) pieces.push(`M${command.cpx} ${command.cpy}`);
        pieces.push(`Q${command.cpx} ${command.cpy} ${command.x} ${command.y}`);
        current = true;
        break;
      case 'bezierCurveTo':
        if (!current) pieces.push(`M${command.cp1x} ${command.cp1y}`);
        pieces.push(
          `C${command.cp1x} ${command.cp1y} ${command.cp2x} ${command.cp2y} ${command.x} ${command.y}`,
        );
        current = true;
        break;
      case 'rect':
        pieces.push(
          `M${command.x} ${command.y}h${command.width}v${command.height}h${-command.width}Z`,
        );
        current = true;
        break;
      case 'roundedRect': {
        const { x, y, width: w, height: h } = command,
          r = command.radius ?? 0;
        pieces.push(
          `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1 ${-r} ${r}h${2 * r - w}a${r} ${r} 0 0 1 ${-r} ${-r}v${2 * r - h}a${r} ${r} 0 0 1 ${r} ${-r}Z`,
        );
        current = true;
        break;
      }
      case 'polygon': {
        pieces.push(
          command.points
            .map(
              (point, index) => `${index ? 'L' : 'M'}${point[0]} ${point[1]}`,
            )
            .join(' ') + 'Z',
        );
        current = true;
        break;
      }
      case 'arc':
      case 'ellipse':
      case 'circle': {
        const rx = command.op === 'ellipse' ? command.radiusX : command.radius,
          ry = command.op === 'ellipse' ? command.radiusY : command.radius;
        const rotation = command.op === 'ellipse' ? (command.rotation ?? 0) : 0;
        const start = command.op === 'circle' ? 0 : (command.startAngle ?? 0),
          end =
            command.op === 'circle'
              ? Math.PI * 2
              : (command.endAngle ?? Math.PI * 2);
        const ccw =
            command.op === 'circle'
              ? false
              : (command.counterclockwise ?? false),
          tau = Math.PI * 2,
          delta = end - start;
        const sweep =
          (!ccw && delta >= tau) || (ccw && -delta >= tau)
            ? tau
            : (((ccw ? -delta : delta) % tau) + tau) % tau;
        const startX =
          command.x +
          rx * Math.cos(start) * Math.cos(rotation) -
          ry * Math.sin(start) * Math.sin(rotation);
        const startY =
          command.y +
          rx * Math.cos(start) * Math.sin(rotation) +
          ry * Math.sin(start) * Math.cos(rotation);
        pieces.push(
          `${command.op === 'circle' || !current ? 'M' : 'L'}${startX} ${startY}`,
        );
        if (sweep > 0) {
          const steps = sweep >= tau ? 2 : 1;
          for (let i = 1; i <= steps; i++) {
            const angle = start + ((ccw ? -1 : 1) * sweep * i) / steps;
            const x =
              command.x +
              rx * Math.cos(angle) * Math.cos(rotation) -
              ry * Math.sin(angle) * Math.sin(rotation);
            const y =
              command.y +
              rx * Math.cos(angle) * Math.sin(rotation) +
              ry * Math.sin(angle) * Math.cos(rotation);
            pieces.push(
              `A${rx} ${ry} ${(rotation * 180) / Math.PI} ${sweep / steps > Math.PI ? 1 : 0} ${ccw ? 0 : 1} ${x} ${y}`,
            );
          }
        }
        if (command.op === 'circle') pieces.push('Z');
        current = true;
        break;
      }
      case 'svg':
        pieces.push(command.data);
        current = true;
        break;
      case 'closePath':
        if (current) pieces.push('Z');
        break;
    }
  }
  return pieces.join(' ');
}
/** Immutable reusable CPU descriptor, backed only by native Path2D (not GPU tessellation). */
export class GraphicsPath2D {
  readonly commands: readonly PathCommand2D[];
  readonly holes: readonly GraphicsPath2D[];
  readonly fillRule: CanvasFillRule;
  readonly bounds: Readonly<Rect2D>;
  private readonly native: Path2D;
  private readonly svgData: string;
  readonly commandCount: number;
  private static hitContext: CanvasRenderingContext2D | undefined;

  constructor(
    commands: readonly PathCommand2D[],
    options: {
      holes?: readonly GraphicsPath2D[];
      fillRule?: CanvasFillRule;
    } = {},
  ) {
    if (
      !Array.isArray(commands) ||
      commands.length > rendering2dLimits.pathCommands
    )
      throw new RangeError('GraphicsPath2D exceeds its command budget.');
    if (
      options.fillRule !== undefined &&
      options.fillRule !== 'evenodd' &&
      options.fillRule !== 'nonzero'
    )
      throw new RangeError('Invalid GraphicsPath2D fill rule.');
    if (
      options.holes !== undefined &&
      (!Array.isArray(options.holes) ||
        options.holes.length > rendering2dLimits.pathCommands ||
        options.holes.some((hole) => !(hole instanceof GraphicsPath2D)))
    )
      throw new TypeError('Invalid GraphicsPath2D holes.');
    let commandCount = (options.holes ?? []).reduce(
      (sum, hole) => sum + hole.commandCount,
      0,
    );
    if (commandCount + commands.length > rendering2dLimits.pathCommands)
      throw new RangeError(
        'GraphicsPath2D nested holes exceed its command budget.',
      );
    this.holes = Object.freeze([...(options.holes ?? [])]);
    this.fillRule = this.holes.length
      ? 'evenodd'
      : (options.fillRule ?? 'nonzero');
    this.native = new Path2D();
    let left = Infinity,
      top = Infinity,
      right = -Infinity,
      bottom = -Infinity;
    let x = 0,
      y = 0,
      startX = 0,
      startY = 0;
    let current = false,
      unknownCurrent = false;
    const point = (px: number, py: number): void => {
      left = Math.min(left, px);
      top = Math.min(top, py);
      right = Math.max(right, px);
      bottom = Math.max(bottom, py);
    };
    const snapshots: PathCommand2D[] = [];
    for (const command of commands) {
      validateCommand(command);
      commandCount +=
        command.op === 'svg'
          ? validateSVG(command.data)
          : command.op === 'polygon'
            ? command.points.length
            : 1;
      if (commandCount > rendering2dLimits.pathCommands)
        throw new RangeError(
          'GraphicsPath2D exceeds its aggregate native command budget.',
        );
      let snapshot: PathCommand2D = Object.freeze({ ...command });
      switch (command.op) {
        case 'moveTo':
          this.native.moveTo(command.x, command.y);
          x = startX = command.x;
          y = startY = command.y;
          current = true;
          unknownCurrent = false;
          break;
        case 'lineTo':
          if (!current) {
            x = startX = command.x;
            y = startY = command.y;
          }
          point(x, y);
          point(command.x, command.y);
          this.native.lineTo(command.x, command.y);
          x = command.x;
          y = command.y;
          current = true;
          break;
        case 'quadraticCurveTo': {
          if (!current) {
            x = startX = command.cpx;
            y = startY = command.cpy;
          }
          if (unknownCurrent) point(command.cpx, command.cpy);
          point(x, y);
          point(command.x, command.y);
          for (const axis of [0, 1]) {
            const a = axis ? y : x,
              b = axis ? command.cpy : command.cpx,
              c = axis ? command.y : command.x;
            const denominator = a - 2 * b + c,
              t = denominator ? (a - b) / denominator : -1;
            if (t > 0 && t < 1)
              point(
                (1 - t) ** 2 * x +
                  2 * (1 - t) * t * command.cpx +
                  t * t * command.x,
                (1 - t) ** 2 * y +
                  2 * (1 - t) * t * command.cpy +
                  t * t * command.y,
              );
          }
          this.native.quadraticCurveTo(
            command.cpx,
            command.cpy,
            command.x,
            command.y,
          );
          x = command.x;
          y = command.y;
          current = true;
          break;
        }
        case 'bezierCurveTo': {
          if (!current) {
            x = startX = command.cp1x;
            y = startY = command.cp1y;
          }
          if (unknownCurrent) {
            point(command.cp1x, command.cp1y);
            point(command.cp2x, command.cp2y);
          }
          point(x, y);
          point(command.x, command.y);
          for (const axis of [0, 1]) {
            const p0 = axis ? y : x,
              p1 = axis ? command.cp1y : command.cp1x,
              p2 = axis ? command.cp2y : command.cp2x,
              p3 = axis ? command.y : command.x;
            const a = -p0 + 3 * p1 - 3 * p2 + p3,
              b = 2 * (p0 - 2 * p1 + p2),
              c = p1 - p0;
            const discriminant = b * b - 4 * a * c;
            const roots =
              a === 0
                ? b === 0
                  ? []
                  : [-c / b]
                : discriminant < 0
                  ? []
                  : [
                      (-b + Math.sqrt(discriminant)) / (2 * a),
                      (-b - Math.sqrt(discriminant)) / (2 * a),
                    ];
            for (const t of roots)
              if (t > 0 && t < 1) {
                const s = 1 - t;
                point(
                  s ** 3 * x +
                    3 * s * s * t * command.cp1x +
                    3 * s * t * t * command.cp2x +
                    t ** 3 * command.x,
                  s ** 3 * y +
                    3 * s * s * t * command.cp1y +
                    3 * s * t * t * command.cp2y +
                    t ** 3 * command.y,
                );
              }
          }
          this.native.bezierCurveTo(
            command.cp1x,
            command.cp1y,
            command.cp2x,
            command.cp2y,
            command.x,
            command.y,
          );
          x = command.x;
          y = command.y;
          current = true;
          break;
        }
        case 'arc':
        case 'ellipse':
        case 'circle': {
          const rx =
              command.op === 'ellipse' ? command.radiusX : command.radius,
            ry = command.op === 'ellipse' ? command.radiusY : command.radius;
          if (rx <= 0 || ry <= 0)
            throw new RangeError('GraphicsPath2D radii must be positive.');
          const rotation =
            command.op === 'ellipse' ? (command.rotation ?? 0) : 0;
          const start = command.op === 'circle' ? 0 : (command.startAngle ?? 0),
            end =
              command.op === 'circle'
                ? Math.PI * 2
                : (command.endAngle ?? Math.PI * 2);
          const ccw =
            command.op === 'circle'
              ? false
              : (command.counterclockwise ?? false);
          const tau = Math.PI * 2,
            delta = end - start;
          const sweep =
            (!ccw && delta >= tau) || (ccw && -delta >= tau)
              ? tau
              : (((ccw ? -delta : delta) % tau) + tau) % tau;
          const effectiveEnd = start + (ccw ? -sweep : sweep);
          const anglePoint = (angle: number): void =>
            point(
              command.x +
                rx * Math.cos(angle) * Math.cos(rotation) -
                ry * Math.sin(angle) * Math.sin(rotation),
              command.y +
                rx * Math.cos(angle) * Math.sin(rotation) +
                ry * Math.sin(angle) * Math.cos(rotation),
            );
          anglePoint(start);
          anglePoint(effectiveEnd);
          const extrema = [
            Math.atan2(-ry * Math.sin(rotation), rx * Math.cos(rotation)),
            Math.atan2(ry * Math.cos(rotation), rx * Math.sin(rotation)),
          ];
          for (const angle of extrema)
            for (const candidate of [angle, angle + Math.PI]) {
              const distance =
                (((ccw ? start - candidate : candidate - start) % tau) + tau) %
                tau;
              if (distance <= sweep) anglePoint(candidate);
            }
          if (command.op !== 'circle' && current) point(x, y);
          if (command.op === 'circle')
            this.native.moveTo(command.x + rx, command.y);
          this.native.ellipse(
            command.x,
            command.y,
            rx,
            ry,
            rotation,
            start,
            end,
            ccw,
          );
          if (!current) {
            startX =
              command.x +
              rx * Math.cos(start) * Math.cos(rotation) -
              ry * Math.sin(start) * Math.sin(rotation);
            startY =
              command.y +
              rx * Math.cos(start) * Math.sin(rotation) +
              ry * Math.sin(start) * Math.cos(rotation);
          }
          x =
            command.x +
            rx * Math.cos(effectiveEnd) * Math.cos(rotation) -
            ry * Math.sin(effectiveEnd) * Math.sin(rotation);
          y =
            command.y +
            rx * Math.cos(effectiveEnd) * Math.sin(rotation) +
            ry * Math.sin(effectiveEnd) * Math.cos(rotation);
          current = true;
          if (command.op === 'circle') {
            this.native.closePath();
            startX = command.x + rx;
            startY = command.y;
            x = startX;
            y = startY;
            unknownCurrent = false;
          }
          break;
        }
        case 'rect':
        case 'roundedRect': {
          if (command.width <= 0 || command.height <= 0)
            throw new RangeError(
              'GraphicsPath2D rectangles must have positive dimensions.',
            );
          point(command.x, command.y);
          point(command.x + command.width, command.y + command.height);
          if (command.op === 'roundedRect') {
            const radius = command.radius ?? 0;
            if (
              radius < 0 ||
              radius > Math.min(command.width, command.height) / 2
            )
              throw new RangeError('Invalid rounded rectangle radius.');
            this.native.roundRect(
              command.x,
              command.y,
              command.width,
              command.height,
              radius,
            );
          } else
            this.native.rect(
              command.x,
              command.y,
              command.width,
              command.height,
            );
          x = startX = command.x;
          y = startY = command.y;
          current = true;
          unknownCurrent = false;
          break;
        }
        case 'polygon': {
          if (
            !Array.isArray(command.points) ||
            command.points.length < 3 ||
            command.points.length > rendering2dLimits.pathCommands ||
            command.points.some(
              (p: readonly number[]) =>
                !Array.isArray(p) ||
                p.length !== 2 ||
                p.some(
                  (v) =>
                    !Number.isFinite(v) ||
                    Math.abs(v) > rendering2dLimits.coordinate,
                ),
            )
          )
            throw new RangeError(
              'GraphicsPath2D polygon requires bounded finite vertices.',
            );
          const points = Object.freeze(
            command.points.map((p: readonly [number, number]) =>
              Object.freeze([p[0], p[1]] as const),
            ),
          );
          snapshot = Object.freeze({ op: 'polygon', points });
          for (let i = 0; i < points.length; i++) {
            const p = points[i]!;
            point(p[0], p[1]);
            if (i === 0) this.native.moveTo(p[0], p[1]);
            else this.native.lineTo(p[0], p[1]);
          }
          this.native.closePath();
          x = startX = points[0]![0];
          y = startY = points[0]![1];
          current = true;
          unknownCurrent = false;
          break;
        }
        case 'svg': {
          // Native SVG path-only measurement: no XML document parsing or external resources.
          const svg = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'svg',
          );
          const path = document.createElementNS(
            svg.namespaceURI,
            'path',
          ) as SVGPathElement;
          path.setAttribute('d', command.data);
          svg.append(path);
          svg.style.cssText =
            'position:absolute;visibility:hidden;pointer-events:none';
          document.documentElement.append(svg);
          try {
            const bounds = path.getBBox();
            if (
              ![bounds.x, bounds.y, bounds.width, bounds.height].every(
                Number.isFinite,
              )
            )
              throw new RangeError('SVG path bounds must be finite.');
            point(bounds.x, bounds.y);
            point(bounds.x + bounds.width, bounds.y + bounds.height);
            this.native.addPath(new Path2D(command.data));
            current = true;
            unknownCurrent = true;
          } finally {
            svg.remove();
          }
          break;
        }
        case 'closePath':
          this.native.closePath();
          point(x, y);
          point(startX, startY);
          x = startX;
          y = startY;
          break;
        default:
          throw new RangeError('Unsupported GraphicsPath2D command.');
      }
      snapshots.push(snapshot);
    }
    // Even-odd subpaths outside the outer path are visible native coverage too.
    for (const hole of this.holes) {
      this.native.addPath(hole.nativePath2D);
      if (hole.bounds.width > 0 || hole.bounds.height > 0) {
        point(hole.bounds.x, hole.bounds.y);
        point(
          hole.bounds.x + hole.bounds.width,
          hole.bounds.y + hole.bounds.height,
        );
      }
    }
    this.commands = Object.freeze(snapshots);
    this.commandCount = commandCount;
    this.svgData = [
      serializeCommands(snapshots),
      ...this.holes.map((hole) => hole.toSVGPathData()),
    ].join(' ');
    this.bounds = Object.freeze({
      x: left === Infinity ? 0 : left,
      y: top === Infinity ? 0 : top,
      width: left === Infinity ? 0 : right - left,
      height: top === Infinity ? 0 : bottom - top,
    });
    Object.freeze(this);
  }
  /** Returns an independent native copy; callers cannot mutate this descriptor. */
  get nativePath2D(): Path2D {
    return new Path2D(this.native);
  }
  toSVGPathData(): string {
    return this.svgData;
  }
  containsPoint(x: number, y: number, stroke?: Stroke2D): boolean {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
    const context = (GraphicsPath2D.hitContext ??=
      document.createElement('canvas').getContext('2d') ?? undefined);
    if (!context)
      throw new Error(
        'Canvas2D is required for geometric GraphicsPath2D picking.',
      );
    if (!stroke) return context.isPointInPath(this.native, x, y, this.fillRule);
    context.lineWidth = stroke.width;
    context.lineCap = stroke.cap ?? 'butt';
    context.lineJoin = stroke.join ?? 'miter';
    context.miterLimit = stroke.miterLimit ?? 10;
    return context.isPointInStroke(this.native, x, y);
  }
}
