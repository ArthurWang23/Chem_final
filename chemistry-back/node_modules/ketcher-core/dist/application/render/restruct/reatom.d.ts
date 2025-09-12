/****************************************************************************
 * Copyright 2021 EPAM Systems
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ***************************************************************************/
import { Atom, Box2Abs } from "../../../domain/entities";
import ReObject from './reobject';
import ReStruct from './restruct';
import { Render } from '../raphaelRender';
interface ElemAttr {
    text: string;
    path: any;
    rbb: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}
declare class ReAtom extends ReObject {
    a: Atom;
    showLabel: boolean;
    hydrogenOnTheLeft: boolean;
    color: string;
    component: number;
    label?: ElemAttr;
    constructor(atom: Atom);
    static isSelectable(): true;
    getVBoxObj(render: Render): Box2Abs | null;
    drawHover(render: Render): any;
    makeHoverPlate(render: Render): any;
    makeSelectionPlate(restruct: ReStruct, paper: any, styles: any): any;
    show(restruct: ReStruct, aid: number, options: any): void;
}
export declare function getColorFromStereoLabel(options: any, stereoLabel: any): any;
export default ReAtom;
