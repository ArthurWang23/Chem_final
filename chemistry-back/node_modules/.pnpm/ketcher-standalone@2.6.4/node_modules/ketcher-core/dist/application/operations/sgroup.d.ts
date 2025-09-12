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
import { AttrValueType, PerformOperationResult } from './operations.types';
import { Struct, Vec2 } from "../../domain/entities";
import { BaseOperation } from './baseOperation';
export declare class AddSGroupAtom extends BaseOperation {
    #private;
    constructor(sgroupId: number, atomId: number);
    execute(struct: Struct): PerformOperationResult;
}
export declare class DeleteSGroupAtom extends BaseOperation {
    #private;
    constructor(sgroupId: number, atomId: number);
    execute(struct: Struct): PerformOperationResult;
}
export declare class SetSGroupAttr extends BaseOperation {
    #private;
    constructor(sgroupId: number, attribute: string, value: AttrValueType);
    execute(struct: Struct): PerformOperationResult;
}
export declare class MoveSGroupData extends BaseOperation {
    #private;
    constructor(sgroupId: number, delta: Vec2);
    execute(struct: Struct): PerformOperationResult;
}
export declare class AddSGroupToHierarchy extends BaseOperation {
    #private;
    constructor(sgroupId: number, parent?: number, children?: number[]);
    execute(struct: Struct): PerformOperationResult;
}
