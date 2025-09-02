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
import { RGroupAttributes, Struct } from "../../domain/entities";
import { BaseOperation } from './baseOperation';
export declare class AddRGroup extends BaseOperation {
    #private;
    constructor(rgroupAttributes: RGroupAttributes, rgroupId?: number);
    execute(struct: Struct): PerformOperationResult;
}
export declare class DeleteRGroup extends BaseOperation {
    #private;
    constructor(rgroupId: number);
    execute(struct: Struct): PerformOperationResult;
}
export declare class AddFragmentToRGroup extends BaseOperation {
    #private;
    constructor(rgroupId: number, fragmentId: number);
    execute(struct: Struct): PerformOperationResult;
}
export declare class DeleteFragmentFromRGroup extends BaseOperation {
    #private;
    constructor(rgroupId: number, fragmentId: number);
    execute(struct: Struct): PerformOperationResult;
}
export declare class SetRGroupAttr extends BaseOperation {
    #private;
    constructor(rgroupId: number, attribute: string, value: AttrValueType);
    execute(struct: Struct): PerformOperationResult;
}
export declare class UpdateIfThen extends BaseOperation {
    #private;
    constructor(newRgroupIndex: number, previousRgroupIndex: number);
    execute(struct: Struct): PerformOperationResult;
}
