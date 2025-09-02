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
import { RxnArrowMode, Struct, Vec2 } from "../../domain/entities";
import { BaseOperation } from './baseOperation';
import { PerformOperationResult } from './operations.types';
export declare class AddRxnArrow extends BaseOperation {
    #private;
    constructor(points: Array<Vec2>, mode?: RxnArrowMode, rxnArrowId?: number);
    execute(struct: Struct): PerformOperationResult;
}
export declare class DeleteRxnArrow extends BaseOperation {
    #private;
    constructor(rxnArrowId: number);
    execute(struct: Struct): PerformOperationResult;
}
export declare class MoveRxnArrow extends BaseOperation {
    #private;
    constructor(rxnArrowId: number, delta: Vec2);
    execute(struct: Struct): PerformOperationResult;
}
export declare class ResizeRxnArrow extends BaseOperation {
    #private;
    constructor(rxnArrowId: number, delta: Vec2, current: Vec2, anchor: Vec2);
    execute(struct: Struct): PerformOperationResult;
}
