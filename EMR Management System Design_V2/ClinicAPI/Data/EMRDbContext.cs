using Microsoft.EntityFrameworkCore;
using ClinicAPI.Models;

namespace ClinicAPI.Data;

public class EMRDbContext : DbContext
{
    public EMRDbContext(DbContextOptions<EMRDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; }
    public DbSet<Patient> Patients { get; set; }
    public DbSet<MedicalRecord> MedicalRecords { get; set; }
    public DbSet<Appointment> Appointments { get; set; }
    public DbSet<Prescription> Prescriptions { get; set; }
    public DbSet<PrescriptionDetail> PrescriptionDetails { get; set; }
    public DbSet<Payment>       Payments       { get; set; }
    public DbSet<PaymentItem>   PaymentItems   { get; set; }
    public DbSet<InsuranceCard> InsuranceCards { get; set; }
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Mã bệnh nhân là duy nhất
        modelBuilder.Entity<Patient>()
            .HasIndex(p => p.PatientCode)
            .IsUnique();

        // FIX: Cascade delete — khi xóa Prescription thì tự xóa PrescriptionDetail
        modelBuilder.Entity<Prescription>()
            .HasMany(p => p.MedicationDetails)
            .WithOne(d => d.Prescription)
            .HasForeignKey(d => d.PrescriptionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}