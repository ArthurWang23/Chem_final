declare namespace _default {
    export { readKeyValuePairs };
    export { readKeyMultiValuePairs };
    export { loadSGroup };
    export { initSGroup };
    export { applySGroupProp };
    export { applySGroupArrayProp };
    export { applyDataSGroupName };
    export { applyDataSGroupQuery };
    export { applyDataSGroupQueryOp };
    export { applyDataSGroupDesc };
    export { applyDataSGroupInfo };
    export { applyDataSGroupData };
    export { applyDataSGroupInfoLine };
    export { applyDataSGroupDataLine };
    export { applyDataSGroupExpand };
}
export default _default;
/**
 * @param str { string }
 * @param valueString { boolean }
 * @returns { Pool }
 */
declare function readKeyValuePairs(str: string, valueString: boolean): Pool;
/**
 * @param str { string }
 * @param valueString { boolean }
 * @returns { Array }
 */
declare function readKeyMultiValuePairs(str: string, valueString: boolean): any[];
declare function loadSGroup(mol: any, sg: any, atomMap: any): any;
declare function initSGroup(sGroups: any, propData: any): void;
declare function applySGroupProp(sGroups: any, propName: any, propData: any, numeric: any, core: any): void;
declare function applySGroupArrayProp(sGroups: any, propName: any, propData: any, shift: any): void;
declare function applyDataSGroupName(sg: any, name: any): void;
declare function applyDataSGroupQuery(sg: any, query: any): void;
declare function applyDataSGroupQueryOp(sg: any, queryOp: any): void;
declare function applyDataSGroupDesc(sGroups: any, propData: any): void;
declare function applyDataSGroupInfo(sg: any, propData: any): void;
declare function applyDataSGroupData(sg: any, data: any, finalize: any): void;
declare function applyDataSGroupInfoLine(sGroups: any, propData: any): void;
declare function applyDataSGroupDataLine(sGroups: any, propData: any, finalize: any): void;
declare function applyDataSGroupExpand(sg: any, expanded: any): void;
import { Pool } from "../../entities/pool";
