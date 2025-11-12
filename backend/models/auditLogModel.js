import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
	{
		actor: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		actorEmail: {
			type: String,
			required: true,
		},
		action: {
			type: String,
			required: true,
			enum: [
				"create",
				"update",
				"delete",
				"login",
				"logout",
				"status_change",
				"refund",
				"feature_toggle",
			],
		},
		entity: {
			type: String,
			required: true,
			enum: ["product", "order", "customer", "coupon", "settings", "auth"],
		},
		entityId: {
			type: String, // Can be ObjectId as string or other identifier
		},
		changes: {
			type: mongoose.Schema.Types.Mixed, // { field: { old: value, new: value } }
		},
		metadata: {
			type: mongoose.Schema.Types.Mixed, // Additional context
		},
		ipAddress: String,
		userAgent: String,
	},
	{ timestamps: true }
);

// Index for efficient queries
auditLogSchema.index({ actor: 1, createdAt: -1 });
auditLogSchema.index({ entity: 1, entityId: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;
