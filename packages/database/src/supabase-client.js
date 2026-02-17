"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSupabaseClient = getSupabaseClient;
exports.initSupabase = initSupabase;
exports.getSupabaseAdmin = getSupabaseAdmin;
const tslib_1 = require("tslib");
const dotenv_1 = tslib_1.__importDefault(require("dotenv"));
const path_1 = tslib_1.__importDefault(require("path"));
const supabase_js_1 = require("@supabase/supabase-js");
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../../.env') });
let supabaseInstance = null;
function initializeSupabase() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Missing required env vars: SUPABASE_URL and SUPABASE_SERVICE_KEY');
    }
    return (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}
function getSupabaseClient() {
    if (!supabaseInstance) {
        supabaseInstance = initializeSupabase();
    }
    return supabaseInstance;
}
function initSupabase() {
    return getSupabaseClient();
}
function getSupabaseAdmin() {
    return getSupabaseClient();
}
exports.default = getSupabaseClient;
//# sourceMappingURL=supabase-client.js.map