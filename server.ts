import dotenv from 'dotenv';
import express, { type NextFunction, type Request, type Response } from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

dotenv.config();
if (fs.existsSync(path.resolve(process.cwd(), '.env.local'))) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true });
}

const PORT = Number(process.env.PORT || 3000);
const HOST = '0.0.0.0';
const BUCKET_NAME = 'files';
const SERVICE_KEY_ERROR_MSG = 'Gagal. Cek Service Role Key di .env';

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

interface TableSchemaSupport {
  hasTanggalBerakhir: boolean;
  hasBerlakuSampai: boolean;
  hasFotoUrl: boolean;
  hasUrlFoto: boolean;
  hasUrlEKartu: boolean;
  hasStatusSertifikat: boolean;
  hasJenisData: boolean;
  hasCreatedAt: boolean;
  detectedAt: number;
}

interface RawPemegangRow {
  id: string | number;
  nama_pemegang?: string | null;
  nik?: string | null;
  program_lpk?: string | null;
  no_sertifikat_bnsp?: string | null;
  no_register_bnsp?: string | null;
  tanggal_terbit?: string | null;
  tanggal_berakhir?: string | null;
  berlaku_sampai?: string | null;
  foto_url?: string | null;
  url_foto?: string | null;
  url_e_kartu?: string | null;
  status_sertifikat?: string | null;
  jenis_data?: string | null;
  created_at?: string | null;
}

interface NormalizedPemegangRow {
  id: string | number;
  nama_pemegang: string | null;
  nik: string | null;
  program_lpk: string | null;
  no_sertifikat_bnsp: string | null;
  no_register_bnsp: string | null;
  tanggal_terbit: string | null;
  tanggal_berakhir: string | null;
  berlaku_sampai: string | null;
  foto_url: string | null;
  url_foto: string | null;
  url_e_kartu: string | null;
  status_sertifikat: string | null;
  jenis_data: string | null;
  created_at: string | null;
}

let cachedSchema: TableSchemaSupport | null = null;

function getSupabaseUrl(): string {
  return (
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    'https://neptkinlbxcrdwxoikyg.supabase.co'
  ).trim();
}

function getServiceRoleKey(): string {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    ''
  ).trim();
}

function getSupabaseAdminClient(): SupabaseClient {
  const supabaseUrl = getSupabaseUrl();
  const serviceRoleKey = getServiceRoleKey();

  if (!supabaseUrl || !serviceRoleKey) {
    throw new HttpError(500, SERVICE_KEY_ERROR_MSG);
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function isServiceKeyOrPermissionError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const maybeErr = err as { message?: string; status?: number; statusCode?: number; code?: string };
  const status = maybeErr.status ?? maybeErr.statusCode;
  if (status === 401 || status === 403) return true;
  const msg = (maybeErr.message || '').toLowerCase();
  return (
    msg.includes('jwt') ||
    msg.includes('invalid api key') ||
    msg.includes('unauthorized') ||
    msg.includes('forbidden') ||
    msg.includes('permission') ||
    msg.includes('row-level security') ||
    msg.includes('violates row-level') ||
    msg.includes('rls') ||
    msg.includes('not allowed') ||
    msg.includes('invalid signature') ||
    msg.includes('compact jws') ||
    msg.includes('service_role') ||
    msg.includes('apikey')
  );
}

function normalizeRow(row: RawPemegangRow): NormalizedPemegangRow {
  const expiry = row.tanggal_berakhir ?? row.berlaku_sampai ?? null;
  const photo = row.foto_url ?? row.url_foto ?? null;
  return {
    id: row.id,
    nama_pemegang: row.nama_pemegang ?? null,
    nik: row.nik ?? null,
    program_lpk: row.program_lpk ?? null,
    no_sertifikat_bnsp: row.no_sertifikat_bnsp ?? null,
    no_register_bnsp: row.no_register_bnsp ?? null,
    tanggal_terbit: row.tanggal_terbit ?? null,
    tanggal_berakhir: expiry,
    berlaku_sampai: expiry,
    foto_url: photo,
    url_foto: photo,
    url_e_kartu: row.url_e_kartu ?? null,
    status_sertifikat: row.status_sertifikat ?? 'VALID AKTIF',
    jenis_data: row.jenis_data ?? null,
    created_at: row.created_at ?? null,
  };
}

async function detectTableSchema(supabaseAdmin: SupabaseClient, forceRefresh = false): Promise<TableSchemaSupport> {
  if (!forceRefresh && cachedSchema && Date.now() - cachedSchema.detectedAt < 5 * 60 * 1000) {
    return cachedSchema;
  }

  const probeCol = async (col: string): Promise<boolean> => {
    const { error } = await supabaseAdmin.from('data_pemegang').select(col).limit(1);
    if (!error) return true;
    if (isServiceKeyOrPermissionError(error)) {
      throw new HttpError(403, SERVICE_KEY_ERROR_MSG);
    }
    return false;
  };

  const [
    hasTanggalBerakhir,
    hasBerlakuSampai,
    hasFotoUrl,
    hasUrlFoto,
    hasUrlEKartu,
    hasStatusSertifikat,
    hasJenisData,
    hasCreatedAt,
  ] = await Promise.all([
    probeCol('tanggal_berakhir'),
    probeCol('berlaku_sampai'),
    probeCol('foto_url'),
    probeCol('url_foto'),
    probeCol('url_e_kartu'),
    probeCol('status_sertifikat'),
    probeCol('jenis_data'),
    probeCol('created_at'),
  ]);

  cachedSchema = {
    hasTanggalBerakhir,
    hasBerlakuSampai,
    hasFotoUrl,
    hasUrlFoto,
    hasUrlEKartu,
    hasStatusSertifikat,
    hasJenisData,
    hasCreatedAt,
    detectedAt: Date.now(),
  };

  return cachedSchema;
}

async function ensureFilesBucket(supabaseAdmin: SupabaseClient): Promise<void> {
  const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();

  if (listError) {
    if (isServiceKeyOrPermissionError(listError)) {
      throw new HttpError(403, SERVICE_KEY_ERROR_MSG);
    }
    throw new HttpError(500, `Gagal memeriksa bucket '${BUCKET_NAME}': ${listError.message}`);
  }

  const existing = (buckets ?? []).find(
    (b) => b.name === BUCKET_NAME || b.id === BUCKET_NAME
  );

  if (!existing) {
    const { error: createError } = await supabaseAdmin.storage.createBucket(BUCKET_NAME, {
      public: true,
    });

    if (createError) {
      const msg = (createError.message || '').toLowerCase();
      if (msg.includes('already exists') || msg.includes('duplicate')) {
        return;
      }
      if (isServiceKeyOrPermissionError(createError)) {
        throw new HttpError(403, SERVICE_KEY_ERROR_MSG);
      }
      throw new HttpError(500, SERVICE_KEY_ERROR_MSG);
    }
  } else if (existing.public === false) {
    const { error: updateError } = await supabaseAdmin.storage.updateBucket(BUCKET_NAME, {
      public: true,
    });
    if (updateError && isServiceKeyOrPermissionError(updateError)) {
      throw new HttpError(403, SERVICE_KEY_ERROR_MSG);
    }
  }
}

function parseBase64Upload(
  dataUrlOrBase64: string,
  fileName?: string,
  contentTypeHint?: string
): { buffer: Buffer; contentType: string; ext: string } {
  let contentType = (contentTypeHint || 'image/png').trim();
  let base64Payload = dataUrlOrBase64.trim();

  const dataUrlMatch = base64Payload.match(/^data:([^;]+);base64,(.+)$/);
  if (dataUrlMatch) {
    contentType = dataUrlMatch[1];
    base64Payload = dataUrlMatch[2];
  }

  const buffer = Buffer.from(base64Payload, 'base64');
  if (!buffer.length) {
    throw new HttpError(400, 'File gambar kosong atau tidak valid.');
  }
  if (buffer.length > 8 * 1024 * 1024) {
    throw new HttpError(400, 'Ukuran file terlalu besar. Maksimal 8 MB.');
  }

  let ext = 'png';
  if (fileName && fileName.includes('.')) {
    const rawExt = fileName.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (rawExt) ext = rawExt;
  } else if (contentType.includes('jpeg') || contentType.includes('jpg')) {
    ext = 'jpg';
  } else if (contentType.includes('webp')) {
    ext = 'webp';
  }

  return { buffer, contentType, ext };
}

async function uploadToFilesBucket(
  supabaseAdmin: SupabaseClient,
  folder: 'foto' | 'ekartu',
  identifier: string,
  dataUrlOrBase64: string,
  fileName?: string,
  contentTypeHint?: string
): Promise<{ publicUrl: string; storagePath: string }> {
  await ensureFilesBucket(supabaseAdmin);

  const { buffer, contentType, ext } = parseBase64Upload(
    dataUrlOrBase64,
    fileName,
    contentTypeHint
  );

  const safeId = identifier.replace(/[^a-zA-Z0-9_-]/g, '') || 'pemegang';
  const storagePath = `${folder}/${safeId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(storagePath, buffer, {
      upsert: true,
      contentType,
    });

  if (uploadError) {
    if (isServiceKeyOrPermissionError(uploadError)) {
      throw new HttpError(403, SERVICE_KEY_ERROR_MSG);
    }
    throw new HttpError(500, `Upload ke bucket '${BUCKET_NAME}' gagal: ${uploadError.message}`);
  }

  const { data } = supabaseAdmin.storage.from(BUCKET_NAME).getPublicUrl(storagePath);
  if (!data?.publicUrl) {
    throw new HttpError(500, `Gagal mendapatkan public URL dari bucket '${BUCKET_NAME}'.`);
  }

  return { publicUrl: data.publicUrl, storagePath };
}

function extractStoragePathFromPublicUrl(url?: string | null): string | null {
  if (!url || !url.startsWith('http')) return null;
  const marker = `/storage/v1/object/public/${BUCKET_NAME}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  const rawPath = url.slice(idx + marker.length).split('?')[0];
  if (!rawPath) return null;
  try {
    return decodeURIComponent(rawPath);
  } catch {
    return rawPath;
  }
}

async function removeStorageFilesByUrls(
  supabaseAdmin: SupabaseClient,
  urls: Array<string | null | undefined>
): Promise<void> {
  const paths = urls
    .map((u) => extractStoragePathFromPublicUrl(u))
    .filter((p): p is string => Boolean(p));

  if (paths.length === 0) return;

  const { error } = await supabaseAdmin.storage.from(BUCKET_NAME).remove(paths);
  if (error) {
    if (isServiceKeyOrPermissionError(error)) {
      throw new HttpError(403, SERVICE_KEY_ERROR_MSG);
    }
    throw new HttpError(500, `Gagal menghapus file di bucket '${BUCKET_NAME}': ${error.message}`);
  }
}

function getTokenSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    getServiceRoleKey() ||
    'apik-super-admin-local-secret-key'
  );
}

function signAdminToken(username: string): string {
  const payload = Buffer.from(
    JSON.stringify({
      sub: username,
      role: 'super_admin',
      exp: Date.now() + 24 * 60 * 60 * 1000,
    })
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', getTokenSecret()).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifyAdminToken(token: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;
  const expected = crypto.createHmac('sha256', getTokenSecret()).update(payload).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return false;
  }
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      exp?: number;
      role?: string;
    };
    return parsed.role === 'super_admin' && typeof parsed.exp === 'number' && parsed.exp > Date.now();
  } catch {
    return false;
  }
}

function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token || !verifyAdminToken(token)) {
    res.status(401).json({ error: 'Sesi admin tidak valid atau telah berakhir. Silakan login kembali.' });
    return;
  }
  next();
}

function buildDbWritePayload(
  schema: TableSchemaSupport,
  fields: {
    nama_pemegang: string;
    nik: string;
    program_lpk: string;
    no_sertifikat_bnsp: string;
    no_register_bnsp: string;
    tanggal_terbit: string;
    tanggal_berakhir: string;
    status_sertifikat: string;
    jenis_data: string | null;
    foto_url: string | null;
    url_e_kartu: string | null;
  }
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    nama_pemegang: fields.nama_pemegang,
    nik: fields.nik,
    program_lpk: fields.program_lpk,
    no_sertifikat_bnsp: fields.no_sertifikat_bnsp,
    no_register_bnsp: fields.no_register_bnsp,
    tanggal_terbit: fields.tanggal_terbit,
  };

  if (schema.hasTanggalBerakhir) {
    payload.tanggal_berakhir = fields.tanggal_berakhir;
  }
  if (schema.hasBerlakuSampai) {
    payload.berlaku_sampai = fields.tanggal_berakhir;
  }
  if (!schema.hasTanggalBerakhir && !schema.hasBerlakuSampai) {
    payload.tanggal_berakhir = fields.tanggal_berakhir;
  }

  if (schema.hasFotoUrl) {
    payload.foto_url = fields.foto_url;
  }
  if (schema.hasUrlFoto) {
    payload.url_foto = fields.foto_url;
  }
  if (!schema.hasFotoUrl && !schema.hasUrlFoto) {
    payload.foto_url = fields.foto_url;
  }

  if (schema.hasStatusSertifikat) {
    payload.status_sertifikat = fields.status_sertifikat;
  }
  if (schema.hasJenisData && fields.jenis_data) {
    payload.jenis_data = fields.jenis_data;
  }
  if (schema.hasUrlEKartu) {
    payload.url_e_kartu = fields.url_e_kartu;
  }

  return payload;
}

async function checkDuplicateNikInProgram(
  supabaseAdmin: SupabaseClient,
  nik: string,
  programLpk: string,
  excludeId?: string | number
): Promise<void> {
  let query = supabaseAdmin
    .from('data_pemegang')
    .select('id, nik, program_lpk')
    .eq('nik', nik)
    .ilike('program_lpk', programLpk);

  if (excludeId !== undefined && excludeId !== null && String(excludeId).trim() !== '') {
    query = query.neq('id', excludeId);
  }

  const { data, error } = await query;
  if (error) {
    if (isServiceKeyOrPermissionError(error)) {
      throw new HttpError(403, SERVICE_KEY_ERROR_MSG);
    }
    throw new HttpError(500, `Gagal memvalidasi NIK: ${error.message}`);
  }

  if (data && data.length > 0) {
    throw new HttpError(
      409,
      `NIK ${nik} sudah terdaftar pada program ${programLpk}. NIK tidak boleh duplikat dalam 1 program_lpk yang sama.`
    );
  }
}

interface AdminWriteBody {
  nama_pemegang?: string;
  nik?: string;
  program_lpk?: string;
  no_sertifikat_bnsp?: string;
  no_register_bnsp?: string;
  tanggal_terbit?: string;
  tanggal_berakhir?: string;
  berlaku_sampai?: string;
  status_sertifikat?: string;
  jenis_data?: string | null;
  foto_url?: string | null;
  url_foto?: string | null;
  url_e_kartu?: string | null;
  fotoBase64?: string | null;
  fotoFileName?: string;
  fotoContentType?: string;
  eKartuBase64?: string | null;
  eKartuFileName?: string;
  eKartuContentType?: string;
}

function validateRequiredFields(body: AdminWriteBody) {
  const nama_pemegang = (body.nama_pemegang || '').trim().toUpperCase();
  const nik = (body.nik || '').trim();
  const program_lpk = (body.program_lpk || '').trim();
  const no_sertifikat_bnsp = (body.no_sertifikat_bnsp || '').trim();
  const no_register_bnsp = (body.no_register_bnsp || '').trim();
  const tanggal_terbit = (body.tanggal_terbit || '').trim();
  const tanggal_berakhir = (body.tanggal_berakhir || body.berlaku_sampai || '').trim();
  const status_sertifikat = (body.status_sertifikat || 'VALID AKTIF').trim() || 'VALID AKTIF';
  const jenis_data = body.jenis_data ? String(body.jenis_data).trim() : null;

  if (!nama_pemegang) throw new HttpError(400, 'Nama pemegang wajib diisi.');
  if (!nik) throw new HttpError(400, 'NIK wajib diisi.');
  if (!program_lpk) throw new HttpError(400, 'Program LPK wajib dipilih.');
  if (!no_sertifikat_bnsp) throw new HttpError(400, 'No Sertifikat BNSP wajib diisi.');
  if (!no_register_bnsp) throw new HttpError(400, 'No Register BNSP wajib diisi.');
  if (!tanggal_terbit) throw new HttpError(400, 'Tanggal terbit wajib diisi.');
  if (!tanggal_berakhir) throw new HttpError(400, 'Tanggal berakhir wajib diisi.');

  return {
    nama_pemegang,
    nik,
    program_lpk,
    no_sertifikat_bnsp,
    no_register_bnsp,
    tanggal_terbit,
    tanggal_berakhir,
    status_sertifikat,
    jenis_data,
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '20mb' }));

  app.post('/api/admin/login', (req: Request, res: Response) => {
    const body = (req.body || {}) as { username?: string; password?: string };
    const expectedUser = process.env.ADMIN_USERNAME || 'admin';
    const expectedPass = process.env.ADMIN_PASSWORD || 'Microsoft';

    if (body.username === expectedUser && body.password === expectedPass) {
      const token = signAdminToken(expectedUser);
      res.json({ ok: true, token });
      return;
    }

    res.status(401).json({ error: 'Username atau password tidak valid.' });
  });

  app.get('/api/admin/status', requireAdminAuth, async (_req: Request, res: Response) => {
    try {
      const supabaseAdmin = getSupabaseAdminClient();
      await ensureFilesBucket(supabaseAdmin);
      res.json({
        serviceRoleConfigured: true,
        bucketReady: true,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : SERVICE_KEY_ERROR_MSG;
      res.json({
        serviceRoleConfigured: Boolean(getServiceRoleKey()),
        bucketReady: false,
        error: message,
      });
    }
  });

  app.get('/api/admin/pemegang', requireAdminAuth, async (_req: Request, res: Response) => {
    try {
      const supabaseAdmin = getSupabaseAdminClient();
      const { data, error } = await supabaseAdmin
        .from('data_pemegang')
        .select('*')
        .order('id', { ascending: false });

      if (error) {
        if (isServiceKeyOrPermissionError(error)) {
          throw new HttpError(403, SERVICE_KEY_ERROR_MSG);
        }
        throw new HttpError(500, `Gagal memuat data dari Supabase: ${error.message}`);
      }

      const rows = ((data as RawPemegangRow[] | null) ?? []).map(normalizeRow);
      res.json({ data: rows });
    } catch (err) {
      const status = err instanceof HttpError ? err.status : 500;
      const message = err instanceof Error ? err.message : 'Gagal memuat data Supabase.';
      res.status(status).json({ error: message });
    }
  });

  app.post('/api/admin/pemegang', requireAdminAuth, async (req: Request, res: Response) => {
    const uploadedPaths: string[] = [];
    let supabaseAdmin: SupabaseClient | null = null;

    try {
      supabaseAdmin = getSupabaseAdminClient();
      const body = (req.body || {}) as AdminWriteBody;
      const validated = validateRequiredFields(body);

      await checkDuplicateNikInProgram(supabaseAdmin, validated.nik, validated.program_lpk);
      const schema = await detectTableSchema(supabaseAdmin);

      let finalFotoUrl: string | null =
        body.foto_url && body.foto_url.startsWith('http')
          ? body.foto_url
          : body.url_foto && body.url_foto.startsWith('http')
            ? body.url_foto
            : null;

      if (body.fotoBase64) {
        const uploadedFoto = await uploadToFilesBucket(
          supabaseAdmin,
          'foto',
          validated.nik,
          body.fotoBase64,
          body.fotoFileName,
          body.fotoContentType
        );
        finalFotoUrl = uploadedFoto.publicUrl;
        uploadedPaths.push(uploadedFoto.storagePath);
      }

      let finalEKartuUrl: string | null =
        body.url_e_kartu && body.url_e_kartu.startsWith('http') ? body.url_e_kartu : null;

      if (body.eKartuBase64 && schema.hasUrlEKartu) {
        const uploadedEKartu = await uploadToFilesBucket(
          supabaseAdmin,
          'ekartu',
          validated.nik,
          body.eKartuBase64,
          body.eKartuFileName,
          body.eKartuContentType
        );
        finalEKartuUrl = uploadedEKartu.publicUrl;
        uploadedPaths.push(uploadedEKartu.storagePath);
      }

      const payload = buildDbWritePayload(schema, {
        ...validated,
        foto_url: finalFotoUrl,
        url_e_kartu: finalEKartuUrl,
      });

      const { data: insertedRow, error: insertError } = await supabaseAdmin
        .from('data_pemegang')
        .insert([payload])
        .select()
        .single();

      if (insertError) {
        if (uploadedPaths.length > 0) {
          await supabaseAdmin.storage.from(BUCKET_NAME).remove(uploadedPaths).catch(() => {});
        }
        if (isServiceKeyOrPermissionError(insertError)) {
          throw new HttpError(403, SERVICE_KEY_ERROR_MSG);
        }
        if (insertError.code === '23505') {
          throw new HttpError(
            409,
            `NIK ${validated.nik} sudah terdaftar pada program ${validated.program_lpk}.`
          );
        }
        throw new HttpError(500, `Gagal menyimpan data ke Supabase: ${insertError.message}`);
      }

      res.status(201).json({
        message: 'Berhasil',
        data: normalizeRow(insertedRow as RawPemegangRow),
      });
    } catch (err) {
      if (supabaseAdmin && uploadedPaths.length > 0) {
        await supabaseAdmin.storage.from(BUCKET_NAME).remove(uploadedPaths).catch(() => {});
      }
      const status = err instanceof HttpError ? err.status : 500;
      const message = err instanceof Error ? err.message : 'Gagal menyimpan data ke Supabase.';
      res.status(status).json({ error: message });
    }
  });

  app.put('/api/admin/pemegang/:id', requireAdminAuth, async (req: Request, res: Response) => {
    const uploadedPaths: string[] = [];
    let supabaseAdmin: SupabaseClient | null = null;

    try {
      supabaseAdmin = getSupabaseAdminClient();
      const recordId = String(req.params.id || '').trim();
      if (!recordId) throw new HttpError(400, 'ID data tidak valid.');

      const body = (req.body || {}) as AdminWriteBody;
      const validated = validateRequiredFields(body);

      const { data: existingRaw, error: fetchError } = await supabaseAdmin
        .from('data_pemegang')
        .select('*')
        .eq('id', recordId)
        .single();

      if (fetchError || !existingRaw) {
        if (fetchError && isServiceKeyOrPermissionError(fetchError)) {
          throw new HttpError(403, SERVICE_KEY_ERROR_MSG);
        }
        throw new HttpError(404, 'Data pemegang tidak ditemukan.');
      }

      const existing = normalizeRow(existingRaw as RawPemegangRow);

      await checkDuplicateNikInProgram(
        supabaseAdmin,
        validated.nik,
        validated.program_lpk,
        recordId
      );

      const schema = await detectTableSchema(supabaseAdmin);

      let finalFotoUrl: string | null =
        body.foto_url !== undefined
          ? body.foto_url
          : body.url_foto !== undefined
            ? body.url_foto
            : existing.foto_url;

      if (body.fotoBase64) {
        await ensureFilesBucket(supabaseAdmin);
        const oldFotoUrl = existing.foto_url || existing.url_foto;
        if (oldFotoUrl) {
          await removeStorageFilesByUrls(supabaseAdmin, [oldFotoUrl]);
        }
        const uploadedFoto = await uploadToFilesBucket(
          supabaseAdmin,
          'foto',
          validated.nik,
          body.fotoBase64,
          body.fotoFileName,
          body.fotoContentType
        );
        finalFotoUrl = uploadedFoto.publicUrl;
        uploadedPaths.push(uploadedFoto.storagePath);
      }

      let finalEKartuUrl: string | null =
        body.url_e_kartu !== undefined ? body.url_e_kartu : existing.url_e_kartu;

      if (body.eKartuBase64 && schema.hasUrlEKartu) {
        await ensureFilesBucket(supabaseAdmin);
        if (existing.url_e_kartu) {
          await removeStorageFilesByUrls(supabaseAdmin, [existing.url_e_kartu]);
        }
        const uploadedEKartu = await uploadToFilesBucket(
          supabaseAdmin,
          'ekartu',
          validated.nik,
          body.eKartuBase64,
          body.eKartuFileName,
          body.eKartuContentType
        );
        finalEKartuUrl = uploadedEKartu.publicUrl;
        uploadedPaths.push(uploadedEKartu.storagePath);
      }

      const payload = buildDbWritePayload(schema, {
        ...validated,
        foto_url: finalFotoUrl && finalFotoUrl.startsWith('http') ? finalFotoUrl : null,
        url_e_kartu: finalEKartuUrl && finalEKartuUrl.startsWith('http') ? finalEKartuUrl : null,
      });

      const { data: updatedRow, error: updateError } = await supabaseAdmin
        .from('data_pemegang')
        .update(payload)
        .eq('id', recordId)
        .select()
        .single();

      if (updateError) {
        if (uploadedPaths.length > 0) {
          await supabaseAdmin.storage.from(BUCKET_NAME).remove(uploadedPaths).catch(() => {});
        }
        if (isServiceKeyOrPermissionError(updateError)) {
          throw new HttpError(403, SERVICE_KEY_ERROR_MSG);
        }
        if (updateError.code === '23505') {
          throw new HttpError(
            409,
            `NIK ${validated.nik} sudah terdaftar pada program ${validated.program_lpk}.`
          );
        }
        throw new HttpError(500, `Gagal mengubah data di Supabase: ${updateError.message}`);
      }

      res.json({
        message: 'Berhasil',
        data: normalizeRow(updatedRow as RawPemegangRow),
      });
    } catch (err) {
      if (supabaseAdmin && uploadedPaths.length > 0) {
        await supabaseAdmin.storage.from(BUCKET_NAME).remove(uploadedPaths).catch(() => {});
      }
      const status = err instanceof HttpError ? err.status : 500;
      const message = err instanceof Error ? err.message : 'Gagal mengubah data di Supabase.';
      res.status(status).json({ error: message });
    }
  });

  app.delete('/api/admin/pemegang/:id', requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const supabaseAdmin = getSupabaseAdminClient();
      const recordId = String(req.params.id || '').trim();
      if (!recordId) throw new HttpError(400, 'ID data tidak valid.');

      const { data: existingRaw, error: fetchError } = await supabaseAdmin
        .from('data_pemegang')
        .select('*')
        .eq('id', recordId)
        .single();

      if (fetchError || !existingRaw) {
        if (fetchError && isServiceKeyOrPermissionError(fetchError)) {
          throw new HttpError(403, SERVICE_KEY_ERROR_MSG);
        }
        throw new HttpError(404, 'Data pemegang tidak ditemukan.');
      }

      const existing = normalizeRow(existingRaw as RawPemegangRow);

      await removeStorageFilesByUrls(supabaseAdmin, [
        existing.foto_url,
        existing.url_foto,
        existing.url_e_kartu,
      ]);

      const { error: deleteError } = await supabaseAdmin
        .from('data_pemegang')
        .delete()
        .eq('id', recordId);

      if (deleteError) {
        if (isServiceKeyOrPermissionError(deleteError)) {
          throw new HttpError(403, SERVICE_KEY_ERROR_MSG);
        }
        throw new HttpError(500, `Gagal menghapus data di Supabase: ${deleteError.message}`);
      }

      res.json({ message: 'Berhasil' });
    } catch (err) {
      const status = err instanceof HttpError ? err.status : 500;
      const message = err instanceof Error ? err.message : 'Gagal menghapus data di Supabase.';
      res.status(status).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (req: Request, res: Response, next: NextFunction) => {
      if (req.path.startsWith('/api/')) {
        next();
        return;
      }
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`Server berjalan di http://${HOST}:${PORT}`);
  });
}

void startServer();
