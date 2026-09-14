/**
 * BinGo – Community Create/Edit Screen
 * Member 4 – Community Coordination
 *
 * Shared form for creating a new post/event/announcement, or editing
 * an existing one (route.params.postId present → edit mode).
 *
 * Only community_leader / waste_authority can create or switch a post
 * into type "event" or "announcement" — matches backend ORGANIZER_ROLES rule.
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import {
  getCommunityPostById,
  createCommunityPost,
  updateCommunityPost,
} from "../services/communityService";
import { takePhoto, pickImageFromLibrary } from "../services/imageService";
import COLORS from "../constants/colors";

const TYPE_OPTIONS = [
  { value: "post",         label: "Post",         emoji: "📝" },
  { value: "event",        label: "Event",        emoji: "📅" },
  { value: "announcement", label: "Announcement", emoji: "📢" },
];
const ORGANIZER_ROLES = ["community_leader", "waste_authority"];
const MIN_CONTENT = 10;

const FieldError = ({ message }) =>
  message ? <Text style={styles.fieldError}>{message}</Text> : null;

const CommunityCreateScreen = ({ route, navigation }) => {
  const { postId } = route.params || {};
  const isEdit = !!postId;
  const { user } = useAuth();
  const canCreatePrivileged = ORGANIZER_ROLES.includes(user?.role);

  const [type, setType] = useState("post");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUri, setImageUri] = useState(null);
  const [eventDate, setEventDate] = useState("");
  const [location, setLocation] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(isEdit);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const post = await getCommunityPostById(postId);
        setType(post.type);
        setTitle(post.title);
        setContent(post.content);
        setImageUri(post.imageUrl || null);
        setEventDate(post.eventDate ? new Date(post.eventDate).toISOString().slice(0, 16).replace("T", " ") : "");
        setLocation(post.location || "");
      } catch (err) {
        setLoadError(err.message || "Failed to load post.");
      } finally {
        setLoadingExisting(false);
      }
    })();
  }, [isEdit, postId]);

  const clearError = (field) => setErrors((prev) => ({ ...prev, [field]: null }));

  const handleImageOption = () => {
    Alert.alert("Add Photo", "Choose an option", [
      {
        text: "Take Photo",
        onPress: async () => {
          try { const img = await takePhoto(); setImageUri(img.uri); }
          catch (err) { if (err.code !== "CANCELLED") Alert.alert("Camera Error", err.message); }
        },
      },
      {
        text: "Choose from Library",
        onPress: async () => {
          try { const img = await pickImageFromLibrary(); setImageUri(img.uri); }
          catch (err) { if (err.code !== "CANCELLED") Alert.alert("Gallery Error", err.message); }
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleRemoveImage = () => {
    Alert.alert("Remove Photo", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => setImageUri(null) },
    ]);
  };

  const availableTypes = canCreatePrivileged
    ? TYPE_OPTIONS
    : TYPE_OPTIONS.filter((t) => t.value === "post");

  const validate = () => {
    const newErrors = {};
    if (!title.trim()) newErrors.title = "Title is required.";
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      newErrors.content = "Content is required.";
    } else if (trimmedContent.length < MIN_CONTENT) {
      newErrors.content = `At least ${MIN_CONTENT} characters required.`;
    }
    if (type === "event") {
      let parsedDate = null;
      if (!eventDate.trim()) {
        newErrors.eventDate = "Event date is required.";
      } else {
        parsedDate = new Date(eventDate.trim().replace(" ", "T"));
        if (Number.isNaN(parsedDate.getTime())) {
          newErrors.eventDate = "Use format YYYY-MM-DD HH:mm.";
        }
      }
      if (!location.trim()) newErrors.location = "Location is required for events.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    clearError("submit");

    const payload = {
      title: title.trim(),
      content: content.trim(),
      type,
      imageUrl: imageUri || null,
    };
    if (type === "event") {
      payload.eventDate = new Date(eventDate.trim().replace(" ", "T")).toISOString();
      payload.location = location.trim();
    }

    try {
      if (isEdit) {
        await updateCommunityPost(postId, payload);
        navigation.replace("CommunityDetails", { postId });
      } else {
        const created = await createCommunityPost(payload);
        navigation.replace("CommunityDetails", { postId: created._id });
      }
    } catch (err) {
      setErrors((prev) => ({ ...prev, submit: err.message || "Failed to save post." }));
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingExisting) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        </View>
      </SafeAreaView>
    );
  }

  if (loadError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorMsg}>{loadError}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.retryBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityRole="button">
          <Text style={styles.headerBack}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? "Edit Post" : "New Post"}</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Type</Text>
        <View style={styles.typeRow}>
          {TYPE_OPTIONS.map((opt) => {
            const disabled = !availableTypes.some((t) => t.value === opt.value);
            const selected = type === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[styles.typeChip, selected && styles.typeChipSelected, disabled && styles.typeChipDisabled]}
                disabled={disabled}
                onPress={() => setType(opt.value)}
              >
                <Text style={styles.typeChipEmoji}>{opt.emoji}</Text>
                <Text style={[styles.typeChipLabel, selected && styles.typeChipLabelSelected]}>{opt.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {!canCreatePrivileged ? (
          <Text style={styles.hint}>Only community leaders and waste authority can post events or announcements.</Text>
        ) : null}

        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={(v) => { setTitle(v); clearError("title"); }}
          placeholder="Give your post a title"
          placeholderTextColor={COLORS.TEXT_DISABLED}
          maxLength={150}
        />
        <FieldError message={errors.title} />

        <Text style={styles.label}>Content</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={content}
          onChangeText={(v) => { setContent(v); clearError("content"); }}
          placeholder="Share the details…"
          placeholderTextColor={COLORS.TEXT_DISABLED}
          multiline
          maxLength={2000}
        />
        <FieldError message={errors.content} />

        <Text style={styles.label}>Photo (optional)</Text>
        {imageUri ? (
          <View>
            <Image source={{ uri: imageUri }} style={styles.photo} resizeMode="cover" />
            <View style={styles.photoActions}>
              <TouchableOpacity style={styles.photoActionBtn} onPress={handleImageOption}>
                <Text style={styles.photoActionText}>Change Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.photoActionBtn} onPress={handleRemoveImage}>
                <Text style={[styles.photoActionText, { color: COLORS.ERROR }]}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.photoPicker} onPress={handleImageOption}>
            <Text style={styles.photoPickerText}>📷  Add a photo</Text>
          </TouchableOpacity>
        )}

        {type === "event" ? (
          <>
            <Text style={styles.label}>Event Date & Time</Text>
            <TextInput
              style={styles.input}
              value={eventDate}
              onChangeText={(v) => { setEventDate(v); clearError("eventDate"); }}
              placeholder="YYYY-MM-DD HH:mm"
              placeholderTextColor={COLORS.TEXT_DISABLED}
            />
            <FieldError message={errors.eventDate} />

            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={(v) => { setLocation(v); clearError("location"); }}
              placeholder="Where is this happening?"
              placeholderTextColor={COLORS.TEXT_DISABLED}
            />
            <FieldError message={errors.location} />
          </>
        ) : null}

        <FieldError message={errors.submit} />

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color={COLORS.TEXT_INVERSE} />
          ) : (
            <Text style={styles.submitBtnText}>{isEdit ? "Save Changes" : "Post"}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32, gap: 12 },
  errorMsg: { fontSize: 14, color: COLORS.TEXT_SECONDARY, textAlign: "center" },
  retryBtn: { marginTop: 16, backgroundColor: COLORS.PRIMARY, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  retryBtnText: { color: COLORS.TEXT_INVERSE, fontWeight: "bold" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.HEADER_BG,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerBack: { color: COLORS.HEADER_TEXT, fontSize: 15, width: 50 },
  headerTitle: { color: COLORS.HEADER_TEXT, fontSize: 17, fontWeight: "bold" },

  form: { padding: 16, paddingBottom: 48 },
  label: { fontSize: 13, fontWeight: "600", color: COLORS.TEXT_PRIMARY, marginTop: 14, marginBottom: 6 },
  hint: { fontSize: 12, color: COLORS.TEXT_SECONDARY, marginTop: 4 },

  input: {
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
  },
  textArea: { minHeight: 100, textAlignVertical: "top" },

  photoPicker: {
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderStyle: "dashed",
    borderRadius: 10,
    paddingVertical: 24,
    alignItems: "center",
  },
  photoPickerText: { color: COLORS.TEXT_SECONDARY, fontSize: 14 },
  photo: { width: "100%", height: 180, borderRadius: 10 },
  photoActions: { flexDirection: "row", gap: 16, marginTop: 8 },
  photoActionBtn: { paddingVertical: 4 },
  photoActionText: { color: COLORS.PRIMARY, fontWeight: "700", fontSize: 13 },

  fieldError: { color: COLORS.ERROR, fontSize: 12, marginTop: 4 },

  typeRow: { flexDirection: "row", gap: 10 },
  typeChip: {
    flex: 1,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 10,
    paddingVertical: 10,
    backgroundColor: COLORS.SURFACE,
  },
  typeChipSelected: { borderColor: COLORS.PRIMARY, backgroundColor: COLORS.PRIMARY_TINT },
  typeChipDisabled: { opacity: 0.4 },
  typeChipEmoji: { fontSize: 20 },
  typeChipLabel: { fontSize: 11, fontWeight: "600", color: COLORS.TEXT_SECONDARY, marginTop: 4 },
  typeChipLabelSelected: { color: COLORS.PRIMARY },

  submitBtn: {
    marginTop: 24,
    backgroundColor: COLORS.ACCENT,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  submitBtnText: { color: COLORS.TEXT_INVERSE, fontWeight: "bold", fontSize: 15 },
});

export default CommunityCreateScreen;
