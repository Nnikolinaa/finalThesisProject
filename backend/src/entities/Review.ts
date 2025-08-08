import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';
import { User } from './User';
import { Vehicle } from './Vehicle';
import { Rental } from './Rental';

@Entity('reviews')
@Unique(['rentalId']) // Enforces that rentalId must be unique across reviews
export class Review {
    @PrimaryGeneratedColumn({ type: 'int', unsigned: false, name: 'review_id' })
    reviewId!: number; // Use definite assignment assertion `!` for non-nullable properties

    @Column({ type: 'int', unsigned: true, name: 'user_id' })
    userId!: number;

    @Column({ type: 'int', unsigned: true, name: 'vehicle_id' })
    vehicleId!: number;

    // Made rentalId non-nullable and removed unique: true from here, as it's handled by @Unique above.
    // If a review MUST be associated with a rental, keep it non-nullable.
    // If a review can EXIST WITHOUT a rental (e.g., a general vehicle review), then it needs to be nullable,
    // and your unique constraint logic might need to change (e.g., a partial unique index if your DB supports it,
    // or custom logic in your backend).
    @Column({ type: 'int', unsigned: true, name: 'rental_id' })
    rentalId!: number;

    @Column({ type: 'int', name: 'rating' })
    rating!: number;

    @Column({ type: 'text', nullable: true, name: 'comment' })
    comment: string | null; // Can be null

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;

    // Relationships
    @ManyToOne(() => User, user => user.reviews) // Added inverse side (assuming User has 'reviews' property)
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @ManyToOne(() => Vehicle, vehicle => vehicle.reviews) // Added inverse side (assuming Vehicle has 'reviews' property)
    @JoinColumn({ name: 'vehicle_id' })
    vehicle!: Vehicle;

    // Changed onDelete to 'CASCADE' or 'RESTRICT' if rental is truly mandatory.
    // SET NULL implies rentalId could be null, which conflicts with rentalId!: number above.
    // If rental is always present and deleting a rental should delete its review, use CASCADE.
    // If a rental cannot be deleted if it has a review, use RESTRICT.
    // Given your logic "A review has already been submitted for this specific rental.", CASCADE or RESTRICT makes more sense.
    // Let's go with RESTRICT for now, to prevent accidental deletion of rentals that have reviews.
    @ManyToOne(() => Rental, rental => rental.review, { onDelete: 'RESTRICT' }) // Assuming Rental has a 'review' property
    @JoinColumn({ name: 'rental_id' })
    rental!: Rental;
}