import { Table } from "@/interfaces";

interface ValidateUnitsInput {
    (curr: number, table: Table) : Promise<number>
}

export const validateUnits: ValidateUnitsInput = async (curr, { units, values: { list = [], custom } }) => {
    let result:number = 0
    const val = list[0]
    if(list.length > 1) {
        await list?.forEach((val, idx) => {
            if(curr >= val) result = units + idx
        })
    } else if (val && curr >= val) {
        result = await Math.floor(units + ((curr - val)/(custom || val)))
    }
    
    return result
}

export default validateUnits