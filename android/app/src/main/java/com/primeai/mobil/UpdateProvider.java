package com.primeai.mobil;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.database.Cursor;
import android.database.MatrixCursor;
import android.net.Uri;
import android.os.Environment;
import android.os.ParcelFileDescriptor;
import android.provider.OpenableColumns;

import java.io.File;
import java.io.FileNotFoundException;

/* Güncelleme APK'sını kurulum ekranına verir.
   Android 7'den sonra dosya:// adresi kurulum ekranına verilemez; indirilen
   APK bu sağlayıcı üzerinden content:// adresiyle paylaşılır. Yalnızca
   uygulamanın kendi indirme klasöründeki dosyalar açılır. */
public class UpdateProvider extends ContentProvider {

    static final String AUTHORITY = "com.primeai.mobil.updates";

    static Uri uriFor(android.content.Context context, File file) {
        return new Uri.Builder()
                .scheme("content")
                .authority(AUTHORITY)
                .appendPath(file.getName())
                .build();
    }

    private File directory() {
        File dir = getContext() == null ? null : getContext().getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
        if (dir == null && getContext() != null) dir = new File(getContext().getFilesDir(), "updates");
        return dir;
    }

    private File fileFor(Uri uri) {
        String name = uri == null ? null : uri.getLastPathSegment();
        if (name == null || name.isEmpty() || name.contains("/") || name.contains("..")) return null;
        File dir = directory();
        if (dir == null) return null;
        return new File(dir, name);
    }

    @Override
    public boolean onCreate() {
        return true;
    }

    @Override
    public Cursor query(Uri uri, String[] projection, String selection, String[] selectionArgs, String sortOrder) {
        File file = fileFor(uri);
        if (file == null || !file.exists()) return null;
        String[] columns = projection != null ? projection
                : new String[]{OpenableColumns.DISPLAY_NAME, OpenableColumns.SIZE};
        MatrixCursor cursor = new MatrixCursor(columns, 1);
        Object[] row = new Object[columns.length];
        for (int i = 0; i < columns.length; i++) {
            if (OpenableColumns.DISPLAY_NAME.equals(columns[i])) row[i] = file.getName();
            else if (OpenableColumns.SIZE.equals(columns[i])) row[i] = file.length();
        }
        cursor.addRow(row);
        return cursor;
    }

    @Override
    public String getType(Uri uri) {
        return "application/vnd.android.package-archive";
    }

    @Override
    public Uri insert(Uri uri, ContentValues values) {
        return null;
    }

    @Override
    public int delete(Uri uri, String selection, String[] selectionArgs) {
        return 0;
    }

    @Override
    public int update(Uri uri, ContentValues values, String selection, String[] selectionArgs) {
        return 0;
    }

    @Override
    public ParcelFileDescriptor openFile(Uri uri, String mode) throws FileNotFoundException {
        File file = fileFor(uri);
        if (file == null || !file.exists()) throw new FileNotFoundException("güncelleme dosyası yok");
        return ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY);
    }
}
