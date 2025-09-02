declare namespace _default {
    export { calcAngle };
    export { fracAngle };
    export { calcNewAtomPos };
    export { degrees };
    export { setFracAngle };
    export { mergeBondsParams };
}
export default _default;
declare function calcAngle(pos0: any, pos1: any): number;
declare function fracAngle(angle: any, angle2: any): number;
declare function calcNewAtomPos(pos0: any, pos1: any, ctrlKey: any): Vec2;
declare function degrees(angle: any): number;
declare function setFracAngle(angle: any): void;
declare function mergeBondsParams(struct1: any, bond1: any, struct2: any, bond2: any): {
    merged: boolean;
    angle: number;
    scale: number;
    cross: boolean;
};
import { Vec2 } from "../../../domain/entities/vec2";
