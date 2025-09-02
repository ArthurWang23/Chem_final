export default ReFrag;
declare class ReFrag extends ReObject {
    static isSelectable(): boolean;
    constructor(frag: any);
    item: any;
    fragGetAtoms(restruct: any, fid: any): any[];
    fragGetBonds(restruct: any, fid: any): any[];
    calcBBox(restruct: any, fid: any, render: any): undefined;
    _draw(render: any, fid: any, attrs: any): any;
    draw(render: any): null;
    drawHover(render: any): void;
    setHover(hover: any, render: any): void;
}
import ReObject from "./reobject";
