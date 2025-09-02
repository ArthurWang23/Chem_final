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
import { Bond } from "../../../domain/entities";
import ReObject from './reobject';
import ReStruct from './restruct';
import { Render } from '../raphaelRender';
declare class ReBond extends ReObject {
    b: Bond;
    doubleBondShift: number;
    path: any;
    neihbid1: number;
    neihbid2: number;
    boldStereo?: boolean;
    rbb?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    constructor(bond: Bond);
    static isSelectable(): boolean;
    drawHover(render: Render): any;
    makeHoverPlate(render: Render): any;
    makeSelectionPlate(restruct: ReStruct, paper: any, options: any): any;
    show(restruct: ReStruct, bid: number, options: any): void;
}
export default ReBond;
