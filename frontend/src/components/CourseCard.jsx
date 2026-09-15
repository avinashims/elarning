import { Link } from 'react-router-dom';
import './CourseCard.css';

function formatPrice(price) {
  if (!price || price === 0) return 'Free';
  return `₹${price.toLocaleString('en-IN')}`;
}

export default function CourseCard({ course, compact }) {
  const rating = course.rating?.average || 0;
  const reviewCount = course.rating?.count || course._count?.reviews || 0;
  const students = course._count?.enrollments || 0;
  const displayRating = rating > 0 ? rating.toFixed(1) : 'New';

  return (
    <Link to={`/courses/${course.id}`} className={`course-card ${compact ? 'compact' : ''}`}>
      <div className="course-card-image">
        {course.thumbnail ? (
          <img src={course.thumbnail} alt={course.title} />
        ) : (
          <div className="course-card-placeholder" />
        )}
      </div>
      <div className="course-card-body">
        <h3>{course.title}</h3>
        {course.teacher && <p className="instructor">{course.teacher.name}</p>}
        <div className="course-card-rating">
          {rating > 0 && <span className="rating">{displayRating}</span>}
          {rating > 0 && <span className="stars">★★★★★</span>}
          <span className="rating-count">({reviewCount > 0 ? reviewCount.toLocaleString() : students.toLocaleString()})</span>
        </div>
        <div className="course-card-footer">
          {students > 50 && <span className="badge badge-primary">Bestseller</span>}
          <span className="price">
            {formatPrice(course.price)}
            {course.originalPrice > course.price && (
              <span className="original-price">₹{course.originalPrice.toLocaleString('en-IN')}</span>
            )}
          </span>
        </div>
      </div>
    </Link>
  );
}
