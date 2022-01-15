import { Table } from "@/interfaces";

interface ValidateUnits {
    (table: Table, curr: number) : Promise<number>
}

const validateUnits: ValidateUnits = async ({ starts, values }, curr) => {
    let result:number = 0
    
    await values?.forEach((val, idx) => {
        if(curr >= val) result = starts + idx
    })
    
    console.log("validateUnits", values, starts, result);
    return result

}

export default validateUnits