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
import { BondAttributes, Struct, Vec2 } from "../../domain/entities";
import { BaseOperation } from './baseOperation';
export declare class AddBond extends BaseOperation {
    #private;
    constructor(bondAttributes: BondAttributes, bondId?: number);
    execute(struct: Struct): PerformOperationResult;
}
export declare class DeleteBond extends BaseOperation {
    #private;
    constructor(bondId: number);
    execute(struct: Struct): PerformOperationResult;
}
export declare class MoveBond extends BaseOperation {
    #private;
    constructor(bondId: number, delta: Vec2);
    execute(_struct: Struct): PerformOperationResult;
}
export declare class SetBondAttr extends BaseOperation {
    #private;
    constructor(bondId: number, attribute: string, value: AttrValueType);
    execute(struct: Struct): PerformOperationResult;
}
