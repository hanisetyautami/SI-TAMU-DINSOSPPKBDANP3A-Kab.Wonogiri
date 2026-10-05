import db from "../config/db.js";
export async function getDepartments(req,res){try{const [rows]=await db.query(`SELECT id,name,description FROM departments WHERE is_active=TRUE ORDER BY name`);res.json({success:true,data:rows});}catch(e){console.error(e);res.status(500).json({success:false,message:"Gagal mengambil tujuan kunjungan."});}}
