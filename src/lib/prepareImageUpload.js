const prepareImageUpload = async (file) => {
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml") return file;

  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / bitmap.width, 1600 / bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    const compressed = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", 0.82));
    if (!compressed || compressed.size >= file.size) return file;

    const filename = file.name.replace(/\.[^.]+$/, "") || "trip-image";
    return new File([compressed], `${filename}.webp`, { type: "image/webp", lastModified: Date.now() });
  } catch {
    return file;
  } finally {
    bitmap?.close();
  }
};

export default prepareImageUpload;
