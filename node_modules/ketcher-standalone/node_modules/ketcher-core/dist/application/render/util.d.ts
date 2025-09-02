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
declare function tfx(v: any): string;
declare function relBox(box: any): {
    x: any;
    y: any;
    width: any;
    height: any;
};
/**
 * Finds intersection of a ray and a box and
 * Returns the shift magnitude to avoid it
 * @param p { Vec2 }
 * @param d { Vec2 }
 * @param bb { Box2Abs }
 */
declare function shiftRayBox(p: any, d: any, bb: any): number;
declare function calcCoordinates(aPoint: any, bPoint: any, lengthHyp: any): {
    pos1: null | {
        x: number;
        y: number;
    };
    pos2: null | {
        x: number;
        y: number;
    };
};
declare const util: {
    tfx: typeof tfx;
    relBox: typeof relBox;
    shiftRayBox: typeof shiftRayBox;
    calcCoordinates: typeof calcCoordinates;
};
export default util;
