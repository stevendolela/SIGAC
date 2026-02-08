namespace SIGAC.Core.Enums
{
    /// <summary>
    /// Tenant subscription plans for SaaS pricing
    /// </summary>
    public enum TenantPlanEnum
    {
        /// <summary>Free/Trial plan</summary>
        Free = 0,

        /// <summary>Starter plan - Small organizations</summary>
        Starter = 1,

        /// <summary>Professional plan - Medium organizations</summary>
        Professional = 2,

        /// <summary>Enterprise plan - Large organizations</summary>
        Enterprise = 3,

        /// <summary>Custom plan - Bespoke solutions</summary>
        Custom = 4
    }
}
