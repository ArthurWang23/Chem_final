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
import { Bond, Struct, Vec2 } from "../../../domain/entities";
import { Action } from './action';
import { ReStruct } from '../../render';
export declare function fromBondAddition(restruct: ReStruct, bond: any, begin: any, end: any, pos?: Vec2, pos2?: Vec2): [Action, number, number, number];
export declare function fromBondsAttrs(restruct: ReStruct, ids: Array<number> | number, attrs: Bond, reset?: boolean): Action;
export declare function fromBondsMerge(restruct: ReStruct, mergeMap: Map<number, number>): Action;
export declare function fromBondStereoUpdate(restruct: ReStruct, bond: Bond, withReverse?: boolean): Action;
export declare function getStereoAtomsMap(struct: Struct, bonds: Array<Bond>, bond?: Bond): Map<any, any>;
export declare function bondChangingAction(restruct: ReStruct, itemID: number, bond: Bond, bondProps: any): Action;
