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
import { Box2Abs, Pile, Pool, Struct, Vec2 } from "../../../domain/entities";
import { LayerMap } from './generalEnumTypes';
import ReAtom from './reatom';
import ReBond from './rebond';
import ReDataSGroupData from './redatasgroupdata';
import ReEnhancedFlag from './reenhancedFlag';
import ReFrag from './refrag';
import ReLoop from './reloop';
import ReRGroup from './rergroup';
import ReRxnArrow from './rerxnarrow';
import ReRxnPlus from './rerxnplus';
import ReSGroup from './resgroup';
import ReSimpleObject from './resimpleObject';
import ReText from './retext';
import { Render } from '../raphaelRender';
import Visel from './visel';
declare class ReStruct {
    static maps: {
        atoms: typeof ReAtom;
        bonds: typeof ReBond;
        rxnPluses: typeof ReRxnPlus;
        rxnArrows: typeof ReRxnArrow;
        frags: typeof ReFrag;
        rgroups: typeof ReRGroup;
        sgroupData: typeof ReDataSGroupData;
        enhancedFlags: typeof ReEnhancedFlag;
        sgroups: typeof ReSGroup;
        reloops: typeof ReLoop;
        simpleObjects: typeof ReSimpleObject;
        texts: typeof ReText;
    };
    render: Render;
    molecule: Struct;
    atoms: Map<number, ReAtom>;
    bonds: Map<number, ReBond>;
    reloops: Map<number, ReLoop>;
    rxnPluses: Map<number, ReRxnPlus>;
    rxnArrows: Map<number, ReRxnArrow>;
    frags: Pool;
    rgroups: Pool;
    sgroups: Map<number, ReSGroup>;
    sgroupData: Map<number, ReDataSGroupData>;
    enhancedFlags: Map<number, ReEnhancedFlag>;
    private simpleObjects;
    texts: Map<number, ReText>;
    private initialized;
    private layers;
    connectedComponents: Pool;
    private ccFragmentType;
    private structChanged;
    private atomsChanged;
    private simpleObjectsChanged;
    private rxnArrowsChanged;
    private rxnPlusesChanged;
    private enhancedFlagsChanged;
    private bondsChanged;
    private textsChanged;
    constructor(molecule: any, render: Render);
    connectedComponentRemoveAtom(aid: number, reAtom?: ReAtom): void;
    clearConnectedComponents(): void;
    getConnectedComponent(aid: Array<number> | number, adjacentComponents: Pile): Pile;
    addConnectedComponent(idSet: Pile<number>): number;
    removeConnectedComponent(ccid: number): boolean;
    assignConnectedComponents(): void;
    initLayers(): void;
    addReObjectPath(group: LayerMap, visel: Visel, path: any, pos?: Vec2 | null, visible?: boolean): void;
    clearMarks(): void;
    markItemRemoved(): void;
    markBond(bid: number, mark: number): void;
    markAtom(aid: number, mark: number): void;
    markItem(map: string, id: number, mark: number): void;
    clearVisel(visel: Visel): void;
    eachItem(func: any): void;
    getVBoxObj(selection?: any): Box2Abs | null;
    translate(d: any): void;
    scale(s: number): void;
    clearVisels(): void;
    update(force: boolean): boolean;
    updateLoops(): void;
    showLoops(): void;
    showSimpleObjects(): void;
    showTexts(): void;
    showReactionSymbols(): void;
    showSGroups(): void;
    showFragments(): void;
    showRGroups(): void;
    loopRemove(loopId: number): void;
    verifyLoops(): void;
    showLabels(): void;
    showEnhancedFlags(): void;
    showBonds(): void;
    setSelection(selection?: any): void;
    showItemSelection(item: any, selected: any): void;
}
export default ReStruct;
