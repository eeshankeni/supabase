import { DEFAULT_MINIMUM_PASSWORD_STRENGTH } from 'lib/constants'
import { z } from 'zod'
import { isSupabaseSourceUrl } from './ProjectImport.utils'

export const FormSchema = z
  .object({
    organization: z.string({
      required_error: 'Please select an organization',
    }),
    projectName: z
      .string()
      .trim()
      .min(1, 'Please enter a project name.') // Required field check
      .min(3, 'Project name must be at least 3 characters long.') // Minimum length check
      .max(64, 'Project name must be no longer than 64 characters.'), // Maximum length check
    highAvailability: z.boolean(),
    postgresVersion: z.string({
      required_error: 'Please enter a Postgres version.',
    }),
    dbRegion: z.string({
      required_error: 'Please select a region.',
    }),
    cloudProvider: z.string({
      required_error: 'Please select a cloud provider.',
    }),

    dbPass: z
      .string({ required_error: 'Please enter a database password.' })
      .min(1, 'Password is required.'),
    dbPassStrength: z
      .union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4)])
      .default(0),
    dbPassStrengthMessage: z.string().default(''),
    dbPassStrengthWarning: z.string().default(''),
    instanceSize: z.string().optional(),
    dataApi: z.boolean(),
    enableRlsEventTrigger: z.boolean(),
    postgresVersionSelection: z.string(),
    useOrioleDb: z.boolean(),
    setupMode: z.enum(['blank', 'import']).default('blank'),
    sourceUrl: z.string().default(''),
    serviceRoleKey: z.string().default(''),
    importDbConnectionString: z.string().default(''),
    managementApiToken: z.string().default(''),
  })
  .superRefine(({ dbPassStrength, dbPassStrengthWarning, setupMode }, ctx) => {
    if (setupMode === 'blank' && dbPassStrength < DEFAULT_MINIMUM_PASSWORD_STRENGTH) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['dbPass'],
        message: dbPassStrengthWarning || 'Password not secure enough',
      })
    }
  })
  .superRefine((values, ctx) => {
    if (values.setupMode !== 'import') return

    if (!isSupabaseSourceUrl(values.sourceUrl)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['sourceUrl'],
        message: 'Source URL must be a valid Supabase project URL.',
      })
    }

    if (values.serviceRoleKey.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['serviceRoleKey'],
        message: 'Service role key is required.',
      })
    }

    if (values.importDbConnectionString.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['importDbConnectionString'],
        message: 'DB connection string is required.',
      })
    }

    if (values.managementApiToken.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['managementApiToken'],
        message: 'Management API token is required.',
      })
    }
  })

export type CreateProjectForm = z.infer<typeof FormSchema>
