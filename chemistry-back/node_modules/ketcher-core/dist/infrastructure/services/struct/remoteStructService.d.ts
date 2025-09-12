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
import { AromatizeData, AromatizeResult, AutomapData, AutomapResult, CalculateCipData, CalculateCipResult, CalculateData, CalculateResult, CheckData, CheckResult, CleanData, CleanResult, ConvertData, ConvertResult, DearomatizeData, DearomatizeResult, GenerateImageOptions, InfoResult, LayoutData, LayoutResult, RecognizeResult, StructService, StructServiceOptions } from "../../../domain/services";
export declare class RemoteStructService implements StructService {
    private readonly apiPath;
    private readonly defaultOptions;
    private readonly customHeaders?;
    constructor(apiPath: string, defaultOptions: StructServiceOptions, customHeaders?: Record<string, string>);
    generateInchIKey(struct: string): Promise<string>;
    info(): Promise<InfoResult>;
    convert(data: ConvertData, options?: StructServiceOptions): Promise<ConvertResult>;
    layout(data: LayoutData, options?: StructServiceOptions): Promise<LayoutResult>;
    clean(data: CleanData, options?: StructServiceOptions): Promise<CleanResult>;
    aromatize(data: AromatizeData, options?: StructServiceOptions): Promise<AromatizeResult>;
    dearomatize(data: DearomatizeData, options?: StructServiceOptions): Promise<DearomatizeResult>;
    calculateCip(data: CalculateCipData, options?: StructServiceOptions): Promise<CalculateCipResult>;
    automap(data: AutomapData, options?: StructServiceOptions): Promise<AutomapResult>;
    check(data: CheckData, options?: StructServiceOptions): Promise<CheckResult>;
    calculate(data: CalculateData, options?: StructServiceOptions): Promise<CalculateResult>;
    recognize(blob: Blob, version: string): Promise<RecognizeResult>;
    generateImageAsBase64(data: string, options?: GenerateImageOptions): Promise<string>;
}
